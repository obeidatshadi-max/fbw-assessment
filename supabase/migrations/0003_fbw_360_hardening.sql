-- Fixes two issues in 0002_fbw_360.sql found by review:
--
-- 1. Broken access control / enumeration: the "anyone can read a link to
--    validate it" policy used `using (true)`, which grants a full table
--    scan of fbw_rater_links to ANY anon/authenticated caller in this
--    shared project — not just someone who already holds one link's uuid.
--    RLS cannot restrict "only if you already know this id" via a plain
--    SELECT policy; the fix is the same pattern already used for
--    get_360_summary: a SECURITY DEFINER function that takes the id as a
--    parameter and returns only that row's validity, never a table grant.
--
-- 2. Missing input validation: fbw_rater_responses.dimension_scores had no
--    shape/range check, so a malicious anonymous submitter could insert
--    out-of-range values (e.g. F: 999999) to skew a leader's 360 average.
--    Each dimension is a sum of 3 items on a 1-3 scale, so valid range is
--    3-9; enforce it with a check constraint.

drop policy "anyone can read a link to validate it" on fbw_rater_links;

create or replace function validate_rater_link(p_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed_at timestamptz;
  v_found boolean;
begin
  select closed_at, true into v_closed_at, v_found
  from fbw_rater_links where id = p_link_id;

  if not found then
    return jsonb_build_object('valid', false);
  end if;

  return jsonb_build_object('valid', v_closed_at is null);
end;
$$;

grant execute on function validate_rater_link(uuid) to anon, authenticated;

alter table fbw_rater_responses
  add constraint dimension_scores_shape check (
    (dimension_scores ? 'F') and (dimension_scores ? 'B') and
    (dimension_scores ? 'W') and (dimension_scores ? 'C') and
    (dimension_scores->>'F')::numeric between 3 and 9 and
    (dimension_scores->>'B')::numeric between 3 and 9 and
    (dimension_scores->>'W')::numeric between 3 and 9 and
    (dimension_scores->>'C')::numeric between 3 and 9
  );
