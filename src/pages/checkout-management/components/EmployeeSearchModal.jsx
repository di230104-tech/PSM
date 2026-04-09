import React, { useState, useEffect, useMemo } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import AppIcon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabaseClient'; // Moved here

const EmployeeSearchModal = ({ onEmployeeSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          employee_number,
          departments (
            name
          )
        `);

      if (error) {
        console.error('Error fetching employees:', error);
        // Optionally add a notification for the error
      } else {
        const formattedEmployees = data.map(emp => ({
          id: emp.id,
          name: emp.full_name,
          full_name: emp.full_name,
          email: emp.email,
          department: emp.departments ? emp.departments.name : 'N/A',
          employeeId: emp.employee_number, // Corrected to use employee_number
        }));
        setEmployees(formattedEmployees);
      }
      setIsLoading(false);
    };

    fetchEmployees();
  }, []);

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    let filtered = employees || [];

    if (searchQuery) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter((employee) =>
      employee?.name?.toLowerCase()?.includes(query) ||
      employee?.email?.toLowerCase()?.includes(query) ||
      employee?.employeeId?.toLowerCase()?.includes(query) ||
      employee?.department?.toLowerCase()?.includes(query)
      );
    }

    if (selectedDepartment) {
      filtered = filtered?.filter((employee) => employee?.department === selectedDepartment);
    }

    return filtered;
  }, [employees, searchQuery, selectedDepartment]);

  // Get unique departments
  const departments = [...new Set(employees?.map((emp) => emp?.department))]?.sort();

  const handleEmployeeSelect = (employee) => {
    onEmployeeSelect?.(employee);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Select Employee</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose who will be assigned this asset
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="pr-10" />

              <AppIcon
                name="Search"
                size={16}
                className="absolute right-3 top-3 text-muted-foreground" />

            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e?.target?.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

              <option value="">All Departments</option>
              {departments?.map((dept) =>
              <option key={dept} value={dept}>{dept}</option>
              )}
            </select>
          </div>
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ?
          <div className="space-y-4">
              {[1, 2, 3, 4]?.map((i) =>
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
            )}
            </div> :
          filteredEmployees?.length > 0 ?
          <div className="space-y-2">
              {filteredEmployees?.map((employee) =>
            <div
              key={employee?.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
              onClick={() => handleEmployeeSelect(employee)}>




                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground truncate">{employee?.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <AppIcon name="Building" size={12} />
                            {employee?.department}
                          </span>

                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{employee?.employeeId}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <AppIcon name="Mail" size={12} />
                          <span className="truncate max-w-[120px]">{employee?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                variant="outline"
                size="sm"
                iconName="Check"
                onClick={(e) => {
                  e?.stopPropagation();
                  handleEmployeeSelect(employee);
                }} />

                </div>
            )}
            </div> :

          <div className="text-center py-12">
              <AppIcon name="Users" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Employees Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedDepartment ?
              'Try adjusting your search criteria or filters.' : 'No employees are currently available in the directory.'
              }
              </p>
              {(searchQuery || selectedDepartment) &&
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('');
              }}>

                  Clear Filters
                </Button>
            }
            </div>
          }
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading employees...' : `${filteredEmployees?.length} of ${employees?.length} employees shown`}
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>);

};

export default EmployeeSearchModal;