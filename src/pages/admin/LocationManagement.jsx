import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { DashboardSkeleton } from '../../components/ui/LoadingState';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import { MapPin, Plus } from 'lucide-react';
import EditLocationModal from './components/EditLocationModal';
import DeleteLocationConfirmationModal from './components/DeleteLocationConfirmationModal';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('locations').select('*').order('name');
    if (error) {
      addNotification('Error fetching locations', 'error');
    } else {
      setLocations(data);
    }
    setIsLoading(false);
  };

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      addNotification('Location name cannot be empty', 'error');
      return;
    }

    const { data, error } = await supabase
      .from('locations')
      .insert([{ name: newLocationName.trim() }])
      .select();

    if (error) {
      addNotification(`Error: ${error.message}`, 'error');
    } else {
      addNotification(`Location "${data[0].name}" added successfully.`);
      setLocations([...locations, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setNewLocationName('');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="text-primary" /> Location Management
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} /> Add New Location
          </h2>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-muted-foreground mb-1">
                Location Name
              </label>
              <Input
                id="locationName"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g., HQ - Floor 1"
              />
            </div>
            <Button type="submit" className="w-full">Add Location</Button>
          </form>
        </div>

        <div className="md:col-span-2 bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Existing Locations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Created At</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{loc.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(loc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => {
                          setEditingLocation(loc);
                          setShowEditLocationModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setLocationToDelete(loc);
                          setShowDeleteConfirmModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {locations.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">No locations found. Add your first location to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

      {showEditLocationModal && editingLocation && (
        <EditLocationModal
          location={editingLocation}
          onClose={() => {
            setShowEditLocationModal(false);
            setEditingLocation(null);
          }}
          onLocationUpdated={() => {
            fetchLocations();
            addNotification('Location updated successfully!', 'success');
          }}
        />
      )}

      {showDeleteConfirmModal && locationToDelete && (
        <DeleteLocationConfirmationModal
          location={locationToDelete}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setLocationToDelete(null);
          }}
          onConfirmDelete={() => {
            fetchLocations();
            addNotification('Location deleted successfully!', 'success');
          }}
        />
      )}
    </div>
  );
};

export default LocationManagement;
