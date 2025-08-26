import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Info, X, Plus, HelpCircle } from "lucide-react";
import { CustomField, FieldRule } from "@/types/project.types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FieldRuleEditorProps {
  field: CustomField;
  allFields: CustomField[];
  onUpdate: (fieldId: string, rule: FieldRule | undefined, readOnly: boolean) => void;
}

export function FieldRuleEditor({ field, allFields, onUpdate }: FieldRuleEditorProps) {
  // Extract the current rule or create a default one
  const [rule, setRule] = React.useState<FieldRule>(
    field.rule || { type: 'concatenation', sourceFields: [], formula: '' }
  );
  const [isRuleEnabled, setIsRuleEnabled] = React.useState<boolean>(!!field.rule);
  const [formula, setFormula] = React.useState<string>(field.rule?.formula || '');
  
  // Available source fields (exclude the current field and any fields that depend on this field to prevent circular dependencies)
  const availableSourceFields = React.useMemo(() => {
    // First, check if any field depends on the current field directly or indirectly
    const dependentFields = new Set<string>();
    
    // Helper function to check for dependencies recursively
    const findDependencies = (fieldId: string) => {
      allFields.forEach(f => {
        if (f.rule && f.rule.sourceFields.includes(fieldId)) {
          dependentFields.add(f.id);
          findDependencies(f.id);
        }
      });
    };
    
    // Find all fields that depend on the current field
    findDependencies(field.id);
    
    // Filter out the current field and all dependent fields
    return allFields.filter(f => 
      f.id !== field.id && 
      !dependentFields.has(f.id)
    );
  }, [field.id, allFields]);

  // Handle adding a source field
  const handleAddSourceField = (fieldId: string) => {
    if (fieldId && !rule.sourceFields.includes(fieldId)) {
      const selectedField = allFields.find(f => f.id === fieldId);
      if (!selectedField) return;
      
      // Add field to sourceFields array
      const updatedSourceFields = [...rule.sourceFields, fieldId];
      
      // Insert field reference into formula at cursor position or append
      const fieldToken = `{${selectedField.name}}`;
      
      const updatedRule = { 
        ...rule, 
        sourceFields: updatedSourceFields,
        formula: formula || fieldToken
      };
      
      setRule(updatedRule);
      setFormula(updatedRule.formula || '');
      
      if (isRuleEnabled) {
        onUpdate(field.id, updatedRule, true);
      }
    }
  };

  // Handle removing a source field
  const handleRemoveSourceField = (fieldId: string) => {
    const fieldToRemove = allFields.find(f => f.id === fieldId);
    if (!fieldToRemove) return;
    
    // Remove field from sourceFields array
    const updatedSourceFields = rule.sourceFields.filter(id => id !== fieldId);
    
    // Update the formula to remove references to this field
    let updatedFormula = formula;
    const fieldToken = `{${fieldToRemove.name}}`;
    updatedFormula = updatedFormula.replace(new RegExp(fieldToken, 'g'), '');
    
    const updatedRule = {
      ...rule,
      sourceFields: updatedSourceFields,
      formula: updatedFormula
    };
    
    setRule(updatedRule);
    setFormula(updatedFormula);
    
    if (isRuleEnabled) {
      onUpdate(field.id, updatedRule, true);
    }
  };

  // Handle formula changes
  const handleFormulaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFormula = e.target.value;
    setFormula(newFormula);
    
    // Extract field references from formula
    const fieldMatches = newFormula.match(/{([^}]+)}/g) || [];
    const referencedFields = fieldMatches.map(match => match.slice(1, -1)); // Remove { }
    
    // Find the field IDs that match the referenced field names
    const updatedSourceFields = allFields
      .filter(f => referencedFields.includes(f.name))
      .map(f => f.id);
    
    const updatedRule = {
      ...rule,
      sourceFields: updatedSourceFields,
      formula: newFormula
    };
    
    setRule(updatedRule);
    
    if (isRuleEnabled) {
      onUpdate(field.id, updatedRule, true);
    }
  };

  // Handle enabling/disabling the rule
  const handleRuleToggle = (checked: boolean) => {
    setIsRuleEnabled(checked);
    if (checked) {
      // Enable the rule
      onUpdate(field.id, rule, true);
    } else {
      // Disable the rule
      onUpdate(field.id, undefined, false);
    }
  };

  // Get the field label by ID
  const getFieldLabelById = (id: string) => {
    const foundField = allFields.find(f => f.id === id);
    return foundField ? foundField.label : id;
  };

  return (
    <Card className="border-dashed border-gray-300 mt-4">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium flex items-center gap-2">
            Auto-generate field value
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    When enabled, this field's value will be automatically generated by concatenating 
                    the values from the selected source fields.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Switch 
            checked={isRuleEnabled}
            onCheckedChange={handleRuleToggle}
          />
        </div>

        {isRuleEnabled && (
          <>
            <div className="space-y-2">
              <Label>Formula</Label>
              <div className="bg-gray-50 rounded-md p-3 mb-2 text-sm">
                <p>Create a formula using field references like <code>{"{fieldName}"}</code></p>
                <p className="text-xs text-muted-foreground mt-1">
                  Example: <code>{"{field_1}"}-{"{field_2}"}-({"{field_3}"})</code>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You can add field references, text, and symbols to create complex formulas.
                </p>
              </div>
              <Textarea 
                value={formula}
                onChange={handleFormulaChange}
                placeholder="Enter your formula with {fieldName} references"
                className="font-mono"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Available Fields</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableSourceFields.map((sourceField) => (
                  <Badge 
                    key={sourceField.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => {
                      const fieldToken = `{${sourceField.name}}`;
                      setFormula(prev => prev + fieldToken);
                      handleFormulaChange({ target: { value: formula + fieldToken } } as React.ChangeEvent<HTMLTextAreaElement>);
                    }}
                  >
                    {sourceField.label} ({sourceField.name})
                  </Badge>
                ))}
                {availableSourceFields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No available fields</p>
                )}
              </div>
              
              {availableSourceFields.length === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
                  No available source fields. Fields with circular dependencies cannot be used as sources.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Selected Fields</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {rule.sourceFields.map((sourceFieldId) => {
                  const sourceField = allFields.find(f => f.id === sourceFieldId);
                  if (!sourceField) return null;
                  return (
                    <Badge key={sourceFieldId} variant="secondary" className="gap-1">
                      {sourceField.label} ({sourceField.name})
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveSourceField(sourceFieldId)} 
                      />
                    </Badge>
                  );
                })}
                {rule.sourceFields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No fields selected yet</p>
                )}
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between mb-1">
                <Label className="text-xs text-muted-foreground">Formula Preview</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        This shows how your formula will be rendered. The actual values will be used when documents are created.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="font-mono text-sm">
                {formula ? (
                  formula
                ) : (
                  <span className="text-muted-foreground italic">Add a formula to see preview</span>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
