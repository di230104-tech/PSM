import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Laptop, 
  Users, 
  Activity, 
  Settings, 
  X,
  PlusCircle,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../../utils/cn';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Handle keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runCommand = useCallback((command) => {
    setIsOpen(false);
    command();
  }, []);

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-300"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#09090b] rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-gray-400 shrink-0" />
          <Command.Input
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg w-full"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-none">
          <Command.Empty className="px-6 py-10 text-center text-gray-500 flex flex-col items-center gap-2">
            <Search className="h-8 w-8 opacity-20" />
            <p className="text-sm">No commands found for this search.</p>
          </Command.Empty>

          <Command.Group 
            heading={<span className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Quick Actions</span>}
            className="mb-2"
          >
            <Command.Item
              onSelect={() => runCommand(() => navigate('/checkout-management'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <Activity className="mr-3 h-4 w-4" />
              <span className="flex-1 text-sm font-medium">Checkout / Assign Asset</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100">
                <span className="text-xs">⌘</span>A
              </kbd>
            </Command.Item>
            
            <Command.Item
              onSelect={() => runCommand(() => navigate('/asset-registration'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <PlusCircle className="mr-3 h-4 w-4" />
              <span className="flex-1 text-sm font-medium">Register New Asset</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100">
                <span className="text-xs">⌘</span>N
              </kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group 
            heading={<span className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Navigation</span>}
          >
            <Command.Item
              onSelect={() => runCommand(() => navigate('/dashboard'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <LayoutDashboard className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </Command.Item>
            
            <Command.Item
              onSelect={() => runCommand(() => navigate('/admin/employees'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <Users className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Employee Management</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => navigate('/assets'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <Laptop className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Asset Inventory</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runCommand(() => navigate('/settings'))}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg cursor-default select-none transition-colors",
                "text-gray-700 dark:text-gray-300",
                "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white"
              )}
            >
              <Settings className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-2.5 bg-gray-50/50 dark:bg-[#09090b]/50">
          <div className="flex gap-4">
            <span className="text-[10px] text-gray-500 flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <kbd className="px-1 py-0.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-[9px] font-mono">Enter</kbd> Select
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <kbd className="px-1 py-0.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-[9px] font-mono">↑↓</kbd> Move
            </span>
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-1.5 uppercase font-bold tracking-wider">
             <kbd className="px-1 py-0.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-[9px] font-mono">Esc</kbd> Close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
