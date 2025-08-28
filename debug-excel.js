const { createClient } = require('@supabase/supabase-js');

async function debugExcelData() {
  const supabase = createClient(
    'https://ntvwgvcqfpcqmfaaagyz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dndndmNxZnBjcW1mYWFhZ3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxMjU1MCwiZXhwIjoyMDcxMjg4NTUwfQ.H3IzpVFlaCQVODxw8xnTMD1iCbbxWndr_NCMMmMkYI8'
  );

  const documentId = 'd7daab53-69b0-4652-add8-9de51ad28959';
  
  // Check document custom field values
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select(`
      *,
      projects!inner(
        id,
        name,
        custom_fields,
        organization_id
      )
    `)
    .eq('id', documentId)
    .single();
  
  if (docError) {
    console.error('Document Error:', docError);
  } else {
    console.log('Document custom field values:', JSON.stringify(document.custom_field_values, null, 2));
    console.log('Project custom fields definition:', JSON.stringify(document.projects.custom_fields, null, 2));
  }
}

debugExcelData();
