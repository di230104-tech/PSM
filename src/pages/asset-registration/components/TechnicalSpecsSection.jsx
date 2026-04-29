import React from 'react';
import Icon from '../../../components/AppIcon';

const TechnicalSpecsSection = ({ register, errors }) => {
  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Settings" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Technical Specifications (Optional)</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processor */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Processor</label>
            <input 
                {...register("technical_specs.processor")} 
                placeholder="e.g. Intel Core i7-11700"
                className={inputClass}
            />
        </div>

        {/* Memory */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Memory (RAM)</label>
            <input 
                {...register("technical_specs.memory")} 
                placeholder="e.g. 16GB DDR4"
                className={inputClass}
            />
        </div>

        {/* Storage */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Storage</label>
            <input 
                {...register("technical_specs.storage")} 
                placeholder="e.g. 512GB NVMe SSD"
                className={inputClass}
            />
        </div>

        {/* Graphics */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Graphics</label>
            <input 
                {...register("technical_specs.graphics")} 
                placeholder="e.g. NVIDIA RTX 3060"
                className={inputClass}
            />
        </div>

        {/* Operating System */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Operating System</label>
            <input 
                {...register("technical_specs.os")} 
                placeholder="e.g. Windows 11 Pro"
                className={inputClass}
            />
        </div>

        {/* Network Card */}
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Network Card</label>
            <input 
                {...register("technical_specs.network_card")} 
                placeholder="e.g. Intel Wi-Fi 6 AX201"
                className={inputClass}
            />
        </div>

        {/* Ports */}
        <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium leading-none">Ports</label>
            <input 
                {...register("technical_specs.ports")} 
                placeholder="e.g. 2x USB-C, 3x USB-A, 1x HDMI, 1x RJ45"
                className={inputClass}
            />
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpecsSection;
