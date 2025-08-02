import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Trash2, AlertTriangle, Shield } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const { exportUserData, deleteAccount } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      await exportUserData();
      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      alert('Please type "DELETE_MY_ACCOUNT" to confirm account deletion.');
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteAccount(deleteConfirmation);
      // User will be redirected automatically
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download a complete copy of your SkillBridge data including your profile, 
            learning progress, and preferences. This data is provided in JSON format.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">What's included:</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Profile information and career goals</li>
                  <li>• Learning progress and roadmap data</li>
                  <li>• Account preferences and settings</li>
                  <li>• GitHub integration data (username, public info)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Warning: This action cannot be undone</h4>
                <p className="text-sm text-red-800 mt-1">
                  Deleting your account will permanently remove all your data including:
                </p>
                <ul className="text-sm text-red-800 mt-2 space-y-1">
                  <li>• Your profile and career information</li>
                  <li>• All learning progress and roadmap data</li>
                  <li>• Account preferences and settings</li>
                  <li>• GitHub integration (you can reconnect later)</li>
                </ul>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE_MY_ACCOUNT" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DELETE_MY_ACCOUNT"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};