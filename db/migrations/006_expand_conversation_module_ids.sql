-- 006_expand_conversation_module_ids.sql
-- Allow newer Forze modules to create conversation rows without failing the module_id check.

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_module_id_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_module_id_check CHECK (
    module_id IN (
      'research',
      'branding',
      'marketing',
      'landing',
      'feasibility',
      'full-launch',
      'general',
      'shadow-board',
      'investor-kit',
      'launch-autopilot',
      'mvp-scalpel'
    )
  );
