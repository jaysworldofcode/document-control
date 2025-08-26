"use client";

import React, { useState } from 'react';
import { CustomField, FieldRule } from '@/types/project.types';
import { FieldRuleEditor } from './field-rule-editor';
import { Button } from '@/components/ui/button';

/**
 * This is a test component to verify the FieldRuleEditor toggle functionality
 */
export const TestRuleEditor: React.FC = () => {
  const [field, setField] = useState<CustomField>({
    id: 'test_field_1',
    name: 'test_field',
    label: 'Test Field',
    type: 'text',
    required: false,
    isActive: true,
    order: 1,
    rule: undefined,
    readOnly: false
  });

  const [showDebug, setShowDebug] = useState(true);

  // Test fields to simulate other custom fields
  const allFields: CustomField[] = [
    {
      id: 'field_1',
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      isActive: true,
      order: 1
    },
    {
      id: 'field_2',
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      isActive: true,
      order: 2
    },
    {
      id: 'field_3',
      name: 'department',
      label: 'Department',
      type: 'text',
      required: false,
      isActive: true,
      order: 3
    },
    field
  ];

  const handleFieldRuleUpdate = (fieldId: string, rule: FieldRule | undefined, readOnly: boolean) => {
    console.log('Field rule updated:', { fieldId, rule, readOnly });
    setField({
      ...field,
      rule,
      readOnly
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Field Rule Editor Test</h1>
      
      {showDebug && (
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Current Field State:</h2>
          <pre className="text-xs">{JSON.stringify(field, null, 2)}</pre>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowDebug(!showDebug)}
          >
            Hide Debug
          </Button>
        </div>
      )}
      
      <div className="border p-4 rounded-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Test Field: {field.label}</h2>
        
        <div className="mb-4 flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Status:</p>
          <div className="flex items-center gap-2">
            {field.readOnly && field.rule && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Rule-based
              </span>
            )}
            {field.readOnly && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Read-only
              </span>
            )}
            {!field.readOnly && !field.rule && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                Editable (No Rule)
              </span>
            )}
          </div>
        </div>
        
        <FieldRuleEditor
          field={field}
          allFields={allFields}
          onUpdate={handleFieldRuleUpdate}
        />
      </div>
      
      <div className="mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            // Reset field to initial state
            setField({
              id: 'test_field_1',
              name: 'test_field',
              label: 'Test Field',
              type: 'text',
              required: false,
              isActive: true,
              order: 1,
              rule: undefined,
              readOnly: false
            });
          }}
        >
          Reset Field
        </Button>
      </div>
    </div>
  );
};

export default TestRuleEditor;
