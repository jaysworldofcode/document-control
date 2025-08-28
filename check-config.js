const { createClient } = require('@supabase/supabase-js');

async function checkConfig() {
  const supabase = createClient(
    'https://ntvwgvcqfpcqmfaaagyz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dndndmNxZnBjcW1mYWFhZ3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxMjU1MCwiZXhwIjoyMDcxMjg4NTUwfQ.H3IzpVFlaCQVODxw8xnTMD1iCbbxWndr_NCMMmMkYI8'
  );

  const { data, error } = await supabase
    .from('project_sharepoint_configs')
    .select('*')
    .eq('project_id', 'd158e5c5-8383-4c79-af55-6ae9223fdb71');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('SharePoint configs:', JSON.stringify(data, null, 2));
  }
}

checkConfig();
