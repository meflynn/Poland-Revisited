# Reshape Qualtrics conjoint export from wide to long format.
#
# Input:  one row per respondent, with C{task}_P{profile}_{Attr}[_label] columns
#         and per-task choice/rating columns:
#           QC{task}Q1 -> forced-choice answer
#           QC{task}Q2 -> 1-5 rating of Proposal 1
#           QC{task}Q3 -> 1-5 rating of Proposal 2
# Output: one row per respondent-task-profile (option), suitable for AMCE-style
#         regressions (e.g. lm / estimatr::lm_robust with respondent clustering).

library(tidyverse)

# ---- Paths ------------------------------------------------------------------
# Resolve relative to this script's location so it works inside the RStudio
# project as well as via Rscript. Falls back to the working directory.
script_dir <- tryCatch(
  dirname(normalizePath(sys.frame(1)$ofile, mustWork = FALSE)),
  error = function(e) getwd()
)
if (!nzchar(script_dir) || is.na(script_dir)) script_dir <- getwd()

input_path  <- file.path(script_dir, "test data labels.csv")
output_path <- file.path(script_dir, "test data labels_long.csv")

# ---- Constants --------------------------------------------------------------
n_tasks    <- 10
n_profiles <- 2
attrs <- c("Country", "Personnel", "UnitType",
           "Proximity", "Economic", "Noise", "Environment")

# ---- Read -------------------------------------------------------------------
# Row 1: column headers (kept).
# Row 2: Qualtrics question text. Row 3: ImportId metadata. Both are skipped.
# Read everything as character so labelled values stay verbatim.
header <- read_csv(input_path, n_max = 0, show_col_types = FALSE) |> names()

raw <- read_csv(
  input_path,
  skip = 3,
  col_names = header,
  col_types = cols(.default = col_character()),
  show_col_types = FALSE
) |>
  filter(!is.na(ResponseId), nzchar(ResponseId), !str_starts(ResponseId, "\\{"))

# ---- Identify column groups -------------------------------------------------
conjoint_cols <- str_subset(header, "^C\\d+_P\\d+_")          # attribute cells
choice_cols   <- str_subset(header, "^QC\\d+Q[123]$")         # choice + ratings
respondent_cols <- setdiff(header, c(conjoint_cols, choice_cols))

# ---- Long-format attributes -------------------------------------------------
# Step 1: pivot every C{task}_P{profile}_{Attr}[_label] column into one row per
# respondent-task-profile-attribute, keeping value and label side by side.
attrs_long <- raw |>
  select(ResponseId, all_of(conjoint_cols)) |>
  pivot_longer(
    cols          = -ResponseId,
    names_to      = c("task", "profile", "attribute", "kind"),
    names_pattern = "C(\\d+)_P(\\d+)_([A-Za-z]+)(_label)?",
    values_to     = "v"
  ) |>
  mutate(
    task    = as.integer(task),
    profile = as.integer(profile),
    # Optional `_label` capture is NA for the numeric/value column.
    kind    = if_else(coalesce(kind, "") == "_label", "label", "value")
  ) |>
  pivot_wider(names_from = kind, values_from = v)

# Step 2: spread attributes into columns, producing `Country`, `Country_label`,
# `Personnel`, `Personnel_label`, ... in the original attribute order.
attrs_wide <- attrs_long |>
  pivot_wider(
    id_cols     = c(ResponseId, task, profile),
    names_from  = attribute,
    values_from = c(value, label),
    names_glue  = "{attribute}_{.value}"
  ) |>
  rename_with(\(x) str_remove(x, "_value$")) |>
  select(ResponseId, task, profile,
         unlist(map(attrs, \(a) c(a, paste0(a, "_label")))))

# ---- Choice / rating per task ----------------------------------------------
choices_by_profile <- raw |>
  select(ResponseId, all_of(choice_cols)) |>
  pivot_longer(
    cols          = -ResponseId,
    names_to      = c("task", "q"),
    names_pattern = "QC(\\d+)Q([123])",
    values_to     = "v"
  ) |>
  mutate(task = as.integer(task)) |>
  pivot_wider(names_from = q, values_from = v) |>
  rename(choice_raw = `1`, p1_rating_raw = `2`, p2_rating_raw = `3`) |>
  crossing(profile = seq_len(n_profiles)) |>
  mutate(
    rating_raw = if_else(profile == 1L, p1_rating_raw, p2_rating_raw),
    rating     = suppressWarnings(as.integer(str_extract(rating_raw, "^\\d+"))),
    chosen = case_when(
      choice_raw == paste0("Prefer Proposal ", profile) ~ 1L,
      str_starts(choice_raw, "Prefer Proposal ")        ~ 0L,
      TRUE                                              ~ NA_integer_
    )
  ) |>
  select(ResponseId, task, profile, choice_raw, chosen, rating_raw, rating)

# ---- Assemble ---------------------------------------------------------------
long <- raw |>
  select(all_of(respondent_cols)) |>
  inner_join(attrs_wide,         by = "ResponseId") |>
  inner_join(choices_by_profile, by = c("ResponseId", "task", "profile")) |>
  arrange(ResponseId, task, profile)

# ---- Write ------------------------------------------------------------------
write_csv(long, output_path, na = "")

message(sprintf(
  "Respondents: %d   Long rows: %d (expected %d)\nWrote: %s",
  n_distinct(long$ResponseId),
  nrow(long),
  n_distinct(long$ResponseId) * n_tasks * n_profiles,
  output_path
))
