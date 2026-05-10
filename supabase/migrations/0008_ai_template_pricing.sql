-- =====================================================================
-- Paperline — AI template generation pricing update (0005)
-- =====================================================================
-- AI-generated templates add extra model cost. Free workspaces get a smaller
-- page allowance plus one AI-generated template per month as a trial.
-- =====================================================================

alter table workspaces alter column pages_limit set default 25;

update workspaces
   set pages_limit = 25
 where plan = 'free'
   and pages_limit = 50;
