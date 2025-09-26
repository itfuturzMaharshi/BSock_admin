import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import toastHelper from '../../utils/toastHelper';
import { PaymentConfigService } from '../../services/payment/paymentConfig.services';

// Interface for Payment Config data
interface SpecificField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file' | 'image';
  mandatory: boolean;
  providedByAdmin?: boolean;
  value?: string;
  options?: string[];
}

interface PaymentModule {
  name: string;
  enabled: boolean;
  termsAndConditions: boolean;
  specificFields: SpecificField[];
}

interface SharedField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file';
  mandatory: boolean;
  options?: string[];
}

interface PaymentConfig {
  _id?: string;
  modules: PaymentModule[];
  sharedFields: SharedField[];
  createdAt?: string;
  updatedAt?: string;
}

const PaymentConfig: React.FC = () => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [hasCheckedExistence, setHasCheckedExistence] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<PaymentConfig>({
    modules: [],
    sharedFields: []
  });

  // Field types
  const fieldTypes = ['text', 'number', 'select', 'textarea', 'file', 'image'];
  const sharedFieldTypes = ['text', 'number', 'select', 'textarea', 'file'];
  
  // Payment types
  const paymentTypes = ['TT', 'ThirdParty', 'Cash'];

  // Check if all payment types are already added
  const allPaymentTypesAdded = () => {
    const existingTypes = formData.modules.map(module => module.name);
    return paymentTypes.every(type => existingTypes.includes(type));
  };

  // Fetch payment config
  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Auto-open modal if no config exists
  useEffect(() => {
    if (!loading && hasCheckedExistence && !paymentConfig) {
      setIsModalOpen(true);
      setIsEditMode(false);
    }
  }, [loading, hasCheckedExistence, paymentConfig]);

  const fetchPaymentConfig = async () => {
    try {
      setLoading(true);
      const response = await PaymentConfigService.listPaymentConfigs(1, 1);
      const docs = response?.data?.docs || [];
      
      if (docs.length > 0) {
        setPaymentConfig(docs[0]);
      } else {
        setPaymentConfig(null);
      }
      setHasCheckedExistence(true);
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
      toastHelper.showTost(
        (error as any)?.message || 'Failed to fetch payment config',
        'error'
      );
      setHasCheckedExistence(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEditConfig = async () => {
    try {
      if (isEditMode && paymentConfig?._id) {
        await PaymentConfigService.updatePaymentConfig({
          id: paymentConfig._id,
          modules: formData.modules,
          sharedFields: formData.sharedFields,
        });
        toastHelper.showTost('Payment config updated successfully!', 'success');
      } else {
        await PaymentConfigService.addPaymentConfig(formData);
        toastHelper.showTost('Payment config added successfully!', 'success');
      }
      setIsModalOpen(false);
      resetForm();
      fetchPaymentConfig();
    } catch (error) {
      console.error('Failed to save payment config:', error);
      toastHelper.showTost('Failed to save payment config!', 'error');
    }
  };

  const handleDeleteConfig = async () => {
    if (!paymentConfig?._id) return;

    const confirmed = await Swal.fire({
      title: 'Delete Payment Config?',
      text: 'This will permanently delete the entire configuration!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    });

    if (confirmed.isConfirmed) {
      try {
        await PaymentConfigService.deletePaymentConfig(paymentConfig._id);
        toastHelper.showTost('Payment config deleted successfully!', 'success');
        setPaymentConfig(null);
      } catch (error) {
        console.error('Failed to delete payment config:', error);
        toastHelper.showTost('Failed to delete payment config!', 'error');
      }
    }
  };

  const openEditModal = () => {
    if (!paymentConfig) return;
    setIsEditMode(true);
    setFormData(paymentConfig);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      modules: [],
      sharedFields: []
    });
  };

  // Helper functions for managing form data
  const addModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        {
          name: '',
          enabled: true,
          termsAndConditions: true,
          specificFields: []
        }
      ]
    });
  };

  const updateModule = (index: number, module: PaymentModule) => {
    const updatedModules = [...formData.modules];
    updatedModules[index] = module;
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const removeModule = (index: number) => {
    const updatedModules = formData.modules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const addSpecificField = (moduleIndex: number) => {
    const updatedModules = [...formData.modules];
    updatedModules[moduleIndex].specificFields.push({
      name: '',
      type: 'text',
      mandatory: false
    });
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const updateSpecificField = (moduleIndex: number, fieldIndex: number, field: SpecificField) => {
    const updatedModules = [...formData.modules];
    updatedModules[moduleIndex].specificFields[fieldIndex] = field;
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const removeSpecificField = (moduleIndex: number, fieldIndex: number) => {
    const updatedModules = [...formData.modules];
    updatedModules[moduleIndex].specificFields.splice(fieldIndex, 1);
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const addSharedField = () => {
    setFormData({
      ...formData,
      sharedFields: [
        ...formData.sharedFields,
        {
          name: '',
          type: 'text',
          mandatory: false
        }
      ]
    });
  };

  const updateSharedField = (index: number, field: SharedField) => {
    const updatedSharedFields = [...formData.sharedFields];
    updatedSharedFields[index] = field;
    setFormData({
      ...formData,
      sharedFields: updatedSharedFields
    });
  };

  const removeSharedField = (index: number) => {
    const updatedSharedFields = formData.sharedFields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sharedFields: updatedSharedFields
    });
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm');
    } catch {
      return '-';
    }
  };

  // Get field type icon
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return 'fas fa-font';
      case 'number': return 'fas fa-hashtag';
      case 'select': return 'fas fa-list';
      case 'textarea': return 'fas fa-align-left';
      case 'file': return 'fas fa-file';
      case 'image': return 'fas fa-image';
      default: return 'fas fa-question';
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Loading Payment Configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your payment modules and shared fields
            </p> */}
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {paymentConfig && (
              <>
                <button
                  onClick={openEditModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-edit"></i>
                  Edit Configuration
                </button>
                <button
                  onClick={handleDeleteConfig}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-trash"></i>
                  Delete Configuration
                </button>
              </>
            )}
          </div>
        </div>
        {/* {paymentConfig && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(paymentConfig.createdAt || '')}</span>
            {paymentConfig.updatedAt && (
              <span className="ml-4">Last Updated: {formatDate(paymentConfig.updatedAt)}</span>
            )}
          </div>
        )} */}
      </div>

      {paymentConfig ? (
        <div className="space-y-8">
          {/* Payment Modules Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <i className="fas fa-credit-card text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Modules</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure different payment methods</p>
              </div>
            </div>
            
            {paymentConfig.modules.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className="fas fa-credit-card text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment Modules</h3>
                <p className="text-gray-500 dark:text-gray-400">Click edit to add payment modules</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentConfig.modules.map((module, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            module.enabled 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            <i className={`fas fa-${
                              module.name === 'TT' ? 'university' :
                              module.name === 'ThirdParty' ? 'handshake' :
                              module.name === 'Cash' ? 'money-bill' : 'credit-card'
                            } ${
                              module.enabled 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {module.name || 'Unnamed Module'}
                            </h3>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            module.enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {module.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <i className="fas fa-file-contract w-4 h-4 mr-2"></i>
                          <span>Terms & Conditions: {module.termsAndConditions ? 'Required' : 'Not Required'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <i className="fas fa-list w-4 h-4 mr-2"></i>
                          <span>{module.specificFields.length} Specific Fields</span>
                        </div>

                        {module.specificFields.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fields:</h4>
                            <div className="space-y-2">
                              {module.specificFields.slice(0, 3).map((field, fieldIndex) => (
                                <div key={fieldIndex} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-md p-2">
                                  <div className="flex items-center gap-2">
                                    <i className={`${getFieldTypeIcon(field.type)} text-gray-400 text-xs`}></i>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                      {field.name || 'Unnamed Field'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {field.mandatory && (
                                      <span className="w-2 h-2 bg-red-500 rounded-full" title="Mandatory"></span>
                                    )}
                                    {field.providedByAdmin && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full" title="Admin Provided"></span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {module.specificFields.length > 3 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  +{module.specificFields.length - 3} more fields
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared Fields Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <i className="fas fa-share-alt text-purple-600 dark:text-purple-400"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shared Fields</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Common fields used across all payment methods</p>
              </div>
            </div>

            {paymentConfig.sharedFields.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className="fas fa-share-alt text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Shared Fields</h3>
                <p className="text-gray-500 dark:text-gray-400">Click edit to add shared fields</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paymentConfig.sharedFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                            <i className={`${getFieldTypeIcon(field.type)} text-gray-600 dark:text-gray-400 text-sm`}></i>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {field.name || 'Unnamed Field'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {field.type} field
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {field.mandatory && (
                            <span className="w-2 h-2 bg-red-500 rounded-full" title="Mandatory"></span>
                          )}
                          {field.type === 'select' && field.options && field.options.length > 0 && (
                            <span className="text-xs text-gray-400" title={`${field.options.length} options`}>
                              {field.options.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <i className="fas fa-cog text-blue-600 dark:text-blue-400 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Configuration Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first payment configuration to get started
          </p>
        </div>
      )}

     {/* Add/Edit Modal */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300">
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto m-4">
      {/* Modal Header */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-20 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-plus'} text-blue-600 dark:text-blue-400`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Payment Configuration' : 'Create Payment Configuration'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode ? 'Update your payment settings and field configurations' : 'Set up payment modules and shared fields for your system'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-8">
        <div className="space-y-10">
          {/* Shared Fields Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                  <i className="fas fa-share-alt text-purple-600 dark:text-purple-400 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shared Fields</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Common fields used across all payment methods</p>
                </div>
              </div>
              <button
                onClick={addSharedField}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <i className="fas fa-plus"></i>
                Add Shared Field
              </button>
            </div>

            {formData.sharedFields.length === 0 ? (
              <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                  <i className="fas fa-share-alt text-purple-400 text-2xl"></i>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Shared Fields</h4>
                <p className="text-gray-500 dark:text-gray-400">Click "Add Shared Field" to create common fields</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.sharedFields.map((field, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Shared Field {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeSharedField(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Field Name
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              value={field.name}
                              onChange={(e) => updateSharedField(index, { ...field, name: e.target.value })}
                              placeholder="Enter field name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Field Type
                            </label>
                            <select
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              value={field.type}
                              onChange={(e) => updateSharedField(index, { ...field, type: e.target.value as any })}
                            >
                              {sharedFieldTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                              checked={field.mandatory}
                              onChange={(e) => updateSharedField(index, { ...field, mandatory: e.target.checked })}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">Required Field</span>
                          </label>
                        </div>

                        {field.type === 'select' && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Select Options
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateSharedField(index, { ...field, options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate options with commas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Modules Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                  <i className="fas fa-credit-card text-blue-600 dark:text-blue-400 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Modules</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure different payment methods and their specific fields</p>
                </div>
              </div>
              <button
                onClick={addModule}
                disabled={allPaymentTypesAdded()}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                  allPaymentTypesAdded()
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`}
                title={allPaymentTypesAdded() ? 'All payment types have been added' : 'Add new payment module'}
              >
                <i className="fas fa-plus"></i>
                Add Module
              </button>
            </div>

            {formData.modules.length === 0 ? (
              <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <i className="fas fa-credit-card text-blue-400 text-2xl"></i>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment Modules</h4>
                <p className="text-gray-500 dark:text-gray-400">Click "Add Module" to create payment methods</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                      {/* Module Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{moduleIndex + 1}</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Payment Module {moduleIndex + 1}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure payment method settings</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeModule(moduleIndex)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>

                      {/* Module Configuration */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Payment Type
                          </label>
                          <select
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            value={module.name}
                            onChange={(e) => updateModule(moduleIndex, { ...module, name: e.target.value })}
                          >
                            <option value="">Select Payment Type</option>
                            {paymentTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                              checked={module.enabled}
                              onChange={(e) => updateModule(moduleIndex, { ...module, enabled: e.target.checked })}
                            />
                            <span className="ml-3 font-medium text-gray-700 dark:text-gray-200">Enable this payment method</span>
                          </label>
                          <label className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                              checked={module.termsAndConditions}
                              onChange={(e) => updateModule(moduleIndex, { ...module, termsAndConditions: e.target.checked })}
                            />
                            <span className="ml-3 font-medium text-gray-700 dark:text-gray-200">Require Terms & Conditions</span>
                          </label>
                        </div>
                      </div>

                      {/* Specific Fields */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-list text-gray-600 dark:text-gray-400"></i>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300">Specific Fields</h5>
                          </div>
                          <button
                            onClick={() => addSpecificField(moduleIndex)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <i className="fas fa-plus"></i>
                            Add Field
                          </button>
                        </div>

                        {module.specificFields.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <i className="fas fa-plus-circle text-gray-400 text-2xl mb-2"></i>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No specific fields added yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {module.specificFields.map((field, fieldIndex) => (
                              <div key={fieldIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{fieldIndex + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Field {fieldIndex + 1}</span>
                                  </div>
                                  <button
                                    onClick={() => removeSpecificField(moduleIndex, fieldIndex)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                  >
                                    <i className="fas fa-times text-xs"></i>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                      Field Name
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                      value={field.name}
                                      onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, name: e.target.value })}
                                      placeholder="Enter field name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                      Field Type
                                    </label>
                                    <select
                                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                      value={field.type}
                                      onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, type: e.target.value as any })}
                                    >
                                      {fieldTypes.map((type) => (
                                        <option key={type} value={type}>
                                          {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                        checked={field.mandatory}
                                        onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, mandatory: e.target.checked })}
                                      />
                                      <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">Required</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                        checked={field.providedByAdmin || false}
                                        onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, providedByAdmin: e.target.checked })}
                                      />
                                      <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400">Admin Value</span>
                                    </label>
                                  </div>
                                </div>

                                {field.providedByAdmin && (
                                  <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                      Default Value
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                      value={field.value || ''}
                                      onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, value: e.target.value })}
                                      placeholder="Enter default value"
                                    />
                                  </div>
                                )}

                                {field.type === 'select' && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                      Select Options
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                      value={field.options?.join(', ') || ''}
                                      onChange={(e) => updateSpecificField(moduleIndex, fieldIndex, { ...field, options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })}
                                      placeholder="Option 1, Option 2, Option 3"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate options with commas</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleAddEditConfig}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus'} mr-2`}></i>
            {isEditMode ? 'Update Configuration' : 'Create Configuration'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PaymentConfig;