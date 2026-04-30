import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabaseClient';

const SYSTEM_PROMPT = `You are the Panasonic ISD Asset Management Copilot. Your job is to help staff manage IT hardware. Keep answers brief, professional, and directly related to the system. Do not answer non-IT questions. When instructing users on workflows (like Scrapping or Maintenance), strictly refer to the buttons and forms available in this application.`;

const AI_KNOWLEDGE_BASE = {
  scrap: {
    text: "To scrap an asset, go to its details page, click Edit, change Status to 'Scrapped', and log the disposal method in Maintenance.",
    actionText: "Take me to Asset List",
    actionRoute: "/assets"
  },
  'write-off': {
    text: "To write off an asset, go to its details page, click the 'Write Off' button in the header, and provide the reason and value.",
    actionText: "View Asset Inventory",
    actionRoute: "/assets"
  },
  dispose: {
    text: "Disposal requires changing the asset status to 'Scrapped' or 'Written Off'. Ensure you've documented the reason in the audit log.",
    actionText: "Open Asset Inventory",
    actionRoute: "/assets"
  },
  register: {
    text: "You can register new assets manually via the registration form or use the bulk import feature for multiple items.",
    actionText: "Go to Registration",
    actionRoute: "/asset-registration"
  },
  mfa: {
    text: "Multi-factor authentication can be set up in your user profile settings to enhance account security.",
    actionText: "Go to MFA Setup",
    actionRoute: "/mfa-setup"
  }
};

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

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

  // AI Simulation logic with RAG (Retrieval-Augmented Generation)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const isQuestion = searchQuery.length > 8 || 
                      /^(how|what|where|why|can|is|help|who)/i.test(searchQuery);

    if (isQuestion && searchQuery.trim() !== '') {
      setIsThinking(true);
      
      const performAiLookup = async () => {
        try {
          // 1. Fetch live database context (RAG)
          const { data: assets } = await supabase
            .from('assets')
            .select(`
              id, 
              asset_tag, 
              status, 
              model,
              employees (full_name)
            `)
            .limit(20);

          const dbContext = "Current System Data (Assets): " + JSON.stringify(assets);
          
          // 2. Prepare Payload (System Prompt + Context + User Query)
          const payload = `${SYSTEM_PROMPT}\n\n${dbContext}\n\nUser Question: ${searchQuery}`;
          
          // 3. Simulated AI Processing
          timeoutRef.current = setTimeout(() => {
            const query = searchQuery.toLowerCase();
            let foundResponse = null;

            // Check if user is asking about a specific asset or person in the context
            const assetMatch = assets?.find(a => 
              query.includes(a.asset_tag?.toLowerCase()) || 
              (a.model && query.includes(a.model.toLowerCase()))
            );

            const personMatch = assets?.find(a => 
              a.employees?.full_name && query.includes(a.employees.full_name.toLowerCase())
            );

            if (assetMatch) {
              const statusText = assetMatch.status === 'In Use' ? `currently assigned to ${assetMatch.employees?.full_name || 'someone'}` : `currently ${assetMatch.status}`;
              foundResponse = {
                text: `Asset ${assetMatch.asset_tag} (${assetMatch.model || 'Unknown Model'}) is ${statusText}.`,
                actionText: "View Asset Details",
                actionRoute: `/assets/${assetMatch.id}`
              };
            } else if (personMatch) {
              foundResponse = {
                text: `${personMatch.employees.full_name} currently has asset ${personMatch.asset_tag} (${personMatch.model || 'N/A'}).`,
                actionText: "View Asset",
                actionRoute: `/assets/${personMatch.id}`
              };
            } else {
              // Fallback to static knowledge base
              for (const [key, response] of Object.entries(AI_KNOWLEDGE_BASE)) {
                if (query.includes(key)) {
                  foundResponse = response;
                  break;
                }
              }
            }

            if (foundResponse) {
              setAiResponse(foundResponse);
            } else if (searchQuery.length > 20) {
              setAiResponse({
                text: "I couldn't find specific data for that request in the current inventory. Would you like to see the full asset list?",
                actionText: "Open Asset Inventory",
                actionRoute: "/assets"
              });
            }
            
            setIsThinking(false);
          }, 1000);
        } catch (error) {
          console.error("AI Context Fetch Error:", error);
          setIsThinking(false);
        }
      };

      performAiLookup();
    } else {
      setAiResponse(null);
      setIsThinking(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const runCommand = useCallback((command) => {
    setIsOpen(false);
    setSearchQuery('');
    command();
  }, []);

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSearchQuery('');
      }}
      label="Global Command Menu"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-300"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#09090b] rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-gray-400 shrink-0" />
          <Command.Input
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Type a command or ask a question (e.g. 'How do I scrap an asset?')..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg w-full"
          />
          {isThinking && (
            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Thinking</span>
            </div>
          )}
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-none">
          {aiResponse && (
            <div className="mb-4 mx-2 mt-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg shadow-blue-500/20 shadow-lg shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">AI Copilot Guidance</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {aiResponse.text}
                    </p>
                  </div>
                  <button
                    onClick={() => runCommand(() => navigate(aiResponse.actionRoute))}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm group"
                  >
                    {aiResponse.actionText}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <Command.Empty className="px-6 py-10 text-center text-gray-500 flex flex-col items-center gap-2">
            {!isThinking && (
              <>
                <Search className="h-8 w-8 opacity-20" />
                <p className="text-sm">No commands found for this search.</p>
              </>
            )}
            {isThinking && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin opacity-40" />
                <p className="text-sm font-medium animate-pulse text-blue-500/80 uppercase tracking-widest text-[10px]">Consulting knowledge base...</p>
              </div>
            )}
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

