import React from 'react';
import { Controller } from 'react-hook-form';
import Icon from '../../../components/AppIcon';

const AssetDetailsSection = ({ register, errors, control }) => {
  // Helper class to mimic your UI's input style
  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Package" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Asset Details</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Asset Category</label>
            <select {...register("category")} className={inputClass}>
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Server">Server</option>
                <option value="Network">Network</option>
                <option value="Mobile">Mobile</option>
                <option value="Tablet">Tablet</option>
                <option value="Software">Software</option>
                <option value="Other">Other</option>
            </select>
            {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        {/* Product Name */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Asset Name</label>
            <input 
                {...register("product_name")} 
                placeholder="e.g. Dell Latitude 7420"
                className={inputClass}
            />
            {errors.product_name && <p className="text-sm text-red-500">{errors.product_name.message}</p>}
        </div>

        {/* Serial Number */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Serial Number</label>
            <input 
                {...register("serial_number")} 
                placeholder="e.g. SN-998877"
                className={inputClass}
            />
            {errors.serial_number && <p className="text-sm text-red-500">{errors.serial_number.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailsSection;
