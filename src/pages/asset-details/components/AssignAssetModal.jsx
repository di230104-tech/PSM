import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import AppIcon from '../../../components/AppIcon';
import { logActivity } from '../../../utils/activityLogger';
import { useSelector } from 'react-redux';

const AssignAssetModal = ({ asset, isOpen, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneeType, setAssigneeType] = useState('employee'); // 'employee' or 'department'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true);
      try {
        const [empResponse, deptResponse] = await Promise.all([
          supabase.from('employees').select('id, full_name, email, employee_number, department_id, departments(name)'),
          supabase.from('departments').select('id, name')
        ]);

        if (empResponse.data) {
          setEmployees(empResponse.data.map(emp => ({
            id: emp.id,
            name: emp.full_name,
            email: emp.email,
            employeeId: emp.employee_number,
            department: emp.departments?.name || 'N/A',
            department_id: emp.department_id,
            type: 'employee'
          })));
        }

        if (deptResponse.data) {
          setDepartments(deptResponse.data.map(dept => ({
            id: dept.id,
            name: dept.name,
            type: 'department'
          })));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const filteredAssignees = useMemo(() => {
    const list = assigneeType === 'employee' ? employees : departments;
    if (!searchQuery) return list.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return list.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.email?.toLowerCase().includes(query)) ||
      (item.employeeId?.toLowerCase().includes(query))
    ).slice(0, 5);
  }, [employees, departments, assigneeType, searchQuery]);

  const handleAssign = async () => {
    if (!selectedAssignee || !asset) return;
    setIsSubmitting(true);

    try {
      const isEmployee = assigneeType === 'employee';
      
      // 1. Create loan record
      const loanPayload = {
        asset_tag: asset.asset_tag,
        employee_id: isEmployee ? selectedAssignee.id : null,
        department_id: isEmployee ? selectedAssignee.department_id : selectedAssignee.id,
        checkout_date: new Date().toISOString(),
        status: 'active'
      };

      const { error: loanError } = await supabase.from('loans').insert([loanPayload]);
      if (loanError) throw loanError;

      // 2. Update asset status
      const assetUpdate = {
        status: 'In Use',
        current_department_id: isEmployee ? selectedAssignee.department_id : selectedAssignee.id
      };

      const { error: assetError } = await supabase
        .from('assets')
        .update(assetUpdate)
        .eq('asset_tag', asset.asset_tag);

      if (assetError) throw assetError;

      // 3. Log activity
      await logActivity(
        'asset_assigned',
        `Asset ${asset.product_name} (${asset.asset_tag}) assigned to ${isEmployee ? 'Employee' : 'Department'}: ${selectedAssignee.name}`,
        asset.asset_tag,
        userId,
        { 
          assigned_to_type: assigneeType, 
          assignee_id: selectedAssignee.id, 
          assignee_name: selectedAssignee.name 
        }
      );

      onSuccess(`Asset successfully assigned to ${selectedAssignee.name}`);
      onClose();
    } catch (error) {
      console.error('Assignment error:', error);
      alert(`Failed to assign asset: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type) => {
    setAssigneeType(type);
    setSelectedAssignee(null);
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Assign Asset</h2>
            <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
          </div>
          <div className="mt-4 flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
              <AppIcon name="Package" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{asset?.product_name}</p>
              <p className="text-xs text-muted-foreground">{asset?.asset_tag}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Assignment Type Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Assign To</label>
            <div className="flex p-1 bg-muted rounded-lg">
              <button
                onClick={() => handleTypeChange('employee')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  assigneeType === 'employee' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Employee
              </button>
              <button
                onClick={() => handleTypeChange('department')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  assigneeType === 'department' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Department
              </button>
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">
              Select {assigneeType === 'employee' ? 'Employee' : 'Department'}
            </label>
            {!selectedAssignee ? (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder={`Search ${assigneeType === 'employee' ? 'employees' : 'departments'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <AppIcon name="Search" size={16} className="absolute left-3 top-3 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  {isLoading ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">Loading...</p>
                  ) : filteredAssignees.length > 0 ? (
                    filteredAssignees.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedAssignee(item)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {assigneeType === 'employee' && (
                            <p className="text-xs text-muted-foreground">{item.department} • {item.employeeId}</p>
                          )}
                        </div>
                        <AppIcon name="ChevronRight" size={14} className="text-muted-foreground" />
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-center py-4 text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {selectedAssignee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedAssignee.name}</p>
                    {assigneeType === 'employee' && (
                      <p className="text-xs text-muted-foreground">{selectedAssignee.department}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAssignee(null)} className="text-xs h-8">
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Assignment Date</label>
            <Input
              type="date"
              value={new Date().toISOString().split('T')[0]}
              disabled
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button
            variant="default"
            fullWidth
            onClick={handleAssign}
            disabled={!selectedAssignee || isSubmitting}
            loading={isSubmitting}
            iconName="UserCheck"
          >
            Confirm Assignment
          </Button>
          <Button variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignAssetModal;
