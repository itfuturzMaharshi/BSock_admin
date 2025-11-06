import { useState, useEffect } from 'react';
import { X, MessageSquare, DollarSign, Clock, CheckCircle, User, Package, Send, BellRing } from 'lucide-react';
import NegotiationService, { Negotiation } from '../../services/negotiation/negotiation.services';
import { useSocket } from '../../context/SocketContext';
import toastHelper from '../../utils/toastHelper';

interface NegotiationGroup {
  bidId: string;
  productId: any;
  negotiations: Negotiation[];
  status: 'negotiation' | 'accepted';
  acceptedBy?: 'Admin' | 'Customer';
  acceptedAt?: string;
}

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NegotiationModal = ({ isOpen, onClose }: NegotiationModalProps) => {
  const { socketService } = useSocket();
  const [activeTab, setActiveTab] = useState('active');
  const [negotiations, setNegotiations] = useState<NegotiationGroup[]>([]);
  const [acceptedNegotiations, setAcceptedNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    action: 'counter' as 'counter' | 'accept',
    offerPrice: '',
    message: ''
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const imageBaseUrl = import.meta.env.VITE_BASE_URL;

  // Group negotiations by bidId to show complete bid flow
  const groupNegotiationsByBidId = (allNegotiations: Negotiation[]): NegotiationGroup[] => {
    const grouped = allNegotiations.reduce((acc, negotiation) => {
      const bidId = negotiation.bidId;
      
      if (!acc[bidId]) {
        acc[bidId] = {
          bidId,
          productId: negotiation.productId,
          negotiations: [],
          status: 'negotiation' as 'negotiation' | 'accepted',
          acceptedBy: undefined,
          acceptedAt: undefined
        };
      }
      
      acc[bidId].negotiations.push(negotiation);
      
      // If any negotiation in the group is accepted, mark the group as accepted
      if (negotiation.status === 'accepted') {
        acc[bidId].status = 'accepted';
        acc[bidId].acceptedBy = negotiation.toUserType || 'Admin';
        acc[bidId].acceptedAt = negotiation.updatedAt;
      }
      
      return acc;
    }, {} as Record<string, NegotiationGroup>);
    
    // Convert to array and sort by creation date (most recent first)
    return Object.values(grouped).sort((a, b) => {
      const aLatest = Math.max(...a.negotiations.map(n => new Date(n.createdAt).getTime()));
      const bLatest = Math.max(...b.negotiations.map(n => new Date(n.createdAt).getTime()));
      return bLatest - aLatest;
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchNegotiations();
      fetchAcceptedNegotiations();
      setupSocketListeners();
    }

    return () => {
      // Cleanup socket listeners when modal closes
      if (socketService) {
        socketService.removeNegotiationListeners();
      }
    };
  }, [isOpen, activeTab, socketService]);

  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    if (!socketService) return;

    // Listen for negotiation notifications
    socketService.onNegotiationNotification((data: any) => {
      console.log('Received negotiation notification:', data);
      setNotifications(prev => [...prev, data]);
      
      // Determine toast type based on event type
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (data.type === 'bid_accepted' || data.type === 'offer_accepted') {
        toastType = 'success';
      } else if (data.type === 'bid_rejected') {
        toastType = 'error';
      }
      
      // Show toast notification with user-friendly message
      toastHelper.showTost(data.message || '📬 New negotiation update', toastType);
      
      // Refresh negotiations if it's a relevant update
      if (data.type === 'new_bid' || data.type === 'counter_offer' || data.type === 'bid_accepted') {
        fetchNegotiations();
        fetchAcceptedNegotiations();
      }
    });

    // Listen for negotiation broadcasts
    socketService.onNegotiationBroadcast((data: any) => {
      console.log('Received negotiation broadcast:', data);
      setNotifications(prev => [...prev, data]);
      
      // Determine toast type based on event type
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (data.type === 'bid_accepted') {
        toastType = 'success';
      }
      
      // Show toast notification with user-friendly message
      toastHelper.showTost(data.message || '📬 New negotiation activity', toastType);
      
      // Refresh negotiations
      fetchNegotiations();
      fetchAcceptedNegotiations();
    });

    // Listen for negotiation updates
    socketService.onNegotiationUpdate((data: any) => {
      console.log('Received negotiation update:', data);
      setNotifications(prev => [...prev, data]);
      
      // Determine toast type based on event type
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (data.type === 'bid_accepted') {
        toastType = 'success';
      }
      
      // Show toast notification with user-friendly message
      toastHelper.showTost(data.message || '📝 Negotiation updated', toastType);
      
      // Refresh negotiations
      fetchNegotiations();
      fetchAcceptedNegotiations();
    });

    // Listen for user typing indicators
    socketService.onUserTyping((data: any) => {
      console.log('User typing:', data);
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    // Listen for users joining/leaving negotiations
    socketService.onUserJoinedNegotiation((data: any) => {
      console.log('User joined negotiation:', data);
      toastHelper.showTost(`${data.userType} joined the negotiation`, 'info');
    });

    socketService.onUserLeftNegotiation((data: any) => {
      console.log('User left negotiation:', data);
      toastHelper.showTost(`${data.userType || 'User'} left the negotiation`, 'info');
    });
  };

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      // Fetch both active and accepted negotiations to show complete bid flow
      const [activeResponse, acceptedResponse] = await Promise.all([
        NegotiationService.getAllNegotiations(1, 50, 'negotiation'),
        NegotiationService.getAcceptedNegotiations(1, 50)
      ]);
      
      // Combine all negotiations and group by bidId
      const allNegotiations = [
        ...(activeResponse.negotiations || []),
        ...(acceptedResponse.negotiations || [])
      ];
      
      // Group negotiations by bidId to show complete flow
      const groupedNegotiations = groupNegotiationsByBidId(allNegotiations);
      setNegotiations(groupedNegotiations);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedNegotiations = async () => {
    try {
      const response = await NegotiationService.getAcceptedNegotiations(1, 50);
      setAcceptedNegotiations(response.negotiations || []);
    } catch (error) {
      console.error('Error fetching accepted negotiations:', error);
    }
  };

  const handleRespond = async () => {
    if (!selectedNegotiation || !selectedNegotiation._id) return;

    try {
      const data = {
        negotiationId: selectedNegotiation._id,
        action: responseData.action,
        offerPrice: responseData.action === 'counter' ? parseFloat(responseData.offerPrice) : undefined,
        message: responseData.message
      };

      await NegotiationService.respondToNegotiation(data);

      // Join negotiation room for real-time updates
      if (socketService && selectedNegotiation._id) {
        socketService.joinNegotiation(selectedNegotiation._id);
      }

      setShowResponseForm(false);
      setSelectedNegotiation(null);
      setResponseData({ action: 'counter', offerPrice: '', message: '' });
      fetchNegotiations();
    } catch (error) {
      console.error('Error responding to negotiation:', error);
    }
  };

  // Check if there's a newer negotiation for the same bid
  const hasNewerNegotiation = (currentNegotiation: Negotiation, negotiationGroup: NegotiationGroup) => {
    if (!negotiationGroup.negotiations || negotiationGroup.negotiations.length === 0) return false;
    
    return negotiationGroup.negotiations.some(negotiation => {
      // Same bid, different negotiation, newer timestamp
      return negotiation.bidId === currentNegotiation.bidId &&
             negotiation._id !== currentNegotiation._id &&
             new Date(negotiation.createdAt) > new Date(currentNegotiation.createdAt) &&
             negotiation.status === 'negotiation';
    });
  };

  // Check if any negotiation for the same bid has been accepted
  const hasAcceptedNegotiation = (negotiationGroup: NegotiationGroup) => {
    return negotiationGroup.status === 'accepted';
  };

  // Check if admin can make a counter offer for the entire bid group
  const canMakeCounterForBid = (negotiationGroup: NegotiationGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow counter
    if (hasAcceptedNegotiation(negotiationGroup)) {
      return false;
    }

    // Admin can always make counter offers until bid is accepted
    return true;
  };

  const canAccept = (negotiation: Negotiation, negotiationGroup: NegotiationGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow accepting
    if (hasAcceptedNegotiation(negotiationGroup)) {
      return false;
    }

    // If there's a newer negotiation for the same bid, don't allow accepting old ones
    if (hasNewerNegotiation(negotiation, negotiationGroup)) {
      return false;
    }

    // Admin can accept customer's offers (when admin is the receiver)
    return negotiation.FromUserType === 'Customer' && negotiation.status === 'negotiation';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductImage = (productId: any) => {
    if (typeof productId === 'string') return '/images/placeholder.jpg';
    const images = productId?.skuFamilyId?.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return `${imageBaseUrl}/${images[0]}`;
    }
    // Fallback to mainImage if available
    if (productId?.mainImage) {
      return `${imageBaseUrl}/${productId.mainImage}`;
    }
    return '/images/placeholder.jpg';
  };

  const getProductName = (productId: any) => {
    if (typeof productId === 'string') return 'Product';
    return productId?.name || 'Product';
  };

  const getUserName = (userId: any) => {
    if (typeof userId === 'string') return 'User';
    return `${userId?.firstName || ''} ${userId?.lastName || ''}`.trim() || 'User';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Negotiations</h2>
            {notifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-orange-500" />
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {notifications.length} new
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.size} user{typingUsers.size > 1 ? 's' : ''} typing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Negotiations
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'accepted'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Accepted Orders
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-[100px] max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* No Data Message */}
              {(activeTab === 'active' ? negotiations.length === 0 : acceptedNegotiations.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'active' ? 'No Active Negotiations' : 'No Accepted Orders'}
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    {activeTab === 'active' 
                      ? 'There are currently no active negotiations. New negotiation requests will appear here when customers make offers on your products.'
                      : 'There are no accepted orders yet. Once negotiations are accepted by either party, they will appear in this section.'
                    }
                  </p>
                </div>
              )}

              {/* Data List */}
              {(activeTab === 'active' ? negotiations.length > 0 : acceptedNegotiations.length > 0) && (
                <div className="space-y-6">
                  {(activeTab === 'active' ? negotiations : acceptedNegotiations).map((item) => {
                // Handle both grouped negotiations and individual accepted negotiations
                const negotiationGroup = activeTab === 'active' ? item as NegotiationGroup : null;
                const individualNegotiation = activeTab === 'accepted' ? item as Negotiation : null;
                
                if (negotiationGroup) {
                  return (
                    <div key={negotiationGroup.bidId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Group Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getProductImage(negotiationGroup.productId)}
                            alt={getProductName(negotiationGroup.productId)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSePykPxV7hbiMoufhNrCVlkEh94nvJQIMDeA&s';
                            }}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {getProductName(negotiationGroup.productId)}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Package className="w-4 h-4 mr-1" />
                                Bid ID: {negotiationGroup?.bidId?.slice(0, 8)}...
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                negotiationGroup.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {negotiationGroup.status === 'accepted' ? 'Accepted' : 'Negotiating'}
                              </span>
                              {negotiationGroup.status === 'accepted' && negotiationGroup.acceptedBy && (
                                <span className="text-sm text-gray-600">
                                  Accepted by: {negotiationGroup.acceptedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bid-level Counter Button */}
                        <div className="flex flex-col space-y-2">
                          {canMakeCounterForBid(negotiationGroup) && (
                            <button
                              onClick={() => {
                                // Use the latest customer negotiation for counter
                                const latestCustomerNegotiation = negotiationGroup.negotiations
                                  .filter(n => n.FromUserType === 'Customer')
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                
                                if (latestCustomerNegotiation) {
                                  setSelectedNegotiation(latestCustomerNegotiation);
                                  setResponseData({ action: 'counter', offerPrice: '', message: '' });
                                  setShowResponseForm(true);
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                              <Send className="w-4 h-4" />
                              <span>Make Counter Offer</span>
                            </button>
                          )}
                          {hasAcceptedNegotiation(negotiationGroup) && (
                            <div className="text-xs text-gray-500 text-center">
                              Bid accepted
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Negotiation Flow */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Bidding Flow:</h4>
                        {negotiationGroup.negotiations
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((negotiation) => (
                            <div key={negotiation._id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span className="font-medium text-gray-900">
                                      {negotiation.FromUserType} Offer
                                    </span>
                                    <span className="flex items-center text-green-600">
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {formatPrice(negotiation.offerPrice)}
                                    </span>
                                    <span className="flex items-center text-gray-500">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {formatDate(negotiation.createdAt)}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      negotiation.status === 'accepted' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {negotiation.status === 'accepted' ? 'Accepted' : 'Pending'}
                                    </span>
                                  </div>
                                  {negotiation.message && (
                                    <p className="text-sm text-gray-600 mt-2">{negotiation.message}</p>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2 ml-4">
                                  {negotiation.status === 'negotiation' && (
                                    <>
                                      {canAccept(negotiation, negotiationGroup) && (
                                        <button
                                          onClick={() => {
                                            setSelectedNegotiation(negotiation);
                                            setResponseData({ action: 'accept', offerPrice: '', message: '' });
                                            setShowResponseForm(true);
                                          }}
                                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Accept</span>
                                        </button>
                                      )}
                                      {hasAcceptedNegotiation(negotiationGroup) && (
                                        <div className="text-xs text-gray-500 text-center">
                                          Other bid accepted
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                } else if (individualNegotiation) {
                  // Handle individual accepted negotiations for the accepted tab
                  return (
                    <div key={individualNegotiation._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <img
                              src={getProductImage(individualNegotiation.productId)}
                              alt={getProductName(individualNegotiation.productId)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSePykPxV7hbiMoufhNrCVlkEh94nvJQIMDeA&s';
                              }}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {getProductName(individualNegotiation.productId)}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {getUserName(individualNegotiation.fromUserId)}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatDate(individualNegotiation.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-600">Offer Price:</span>
                              <span className="font-medium text-green-600">
                                {formatPrice(individualNegotiation.offerPrice)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">Status:</span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Accepted
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Accepted By:</span>
                              <span className="font-medium text-gray-900">
                                {individualNegotiation.toUserType}
                              </span>
                            </div>
                          </div>

                          {individualNegotiation.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">{individualNegotiation.message}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button for Accepted Orders */}
                        {/* <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => {
                              // Navigate to product details page
                              const productId = typeof individualNegotiation.productId === 'string' 
                                ? individualNegotiation.productId 
                                : individualNegotiation.productId._id;
                              window.location.href = `/#/product/${productId}`;
                            }}
                            className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                          >
                            <Package className="w-4 h-4" />
                            <span>View Product</span>
                          </button>
                        </div> */}
                      </div>
                    </div>
                  );
                }
                return null;
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Response Form Modal */}
        {showResponseForm && selectedNegotiation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {responseData.action === 'accept' ? 'Accept Offer' : 'Make Counter Offer'}
                  </h3>
                  <button
                    onClick={() => setShowResponseForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleRespond(); }} className="space-y-4">
                  {responseData.action === 'counter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counter Offer Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={responseData.offerPrice}
                        onChange={(e) => setResponseData({ ...responseData, offerPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your counter offer"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={responseData.message}
                      onChange={(e) => {
                        setResponseData({ ...responseData, message: e.target.value });
                        // Send typing indicator
                        if (socketService && selectedNegotiation._id) {
                          socketService.sendNegotiationTyping(selectedNegotiation._id, e.target.value.length > 0);
                        }
                      }}
                      onBlur={() => {
                        // Stop typing indicator when user stops typing
                        if (socketService && selectedNegotiation._id) {
                          socketService.sendNegotiationTyping(selectedNegotiation._id, false);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add a message..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowResponseForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                        responseData.action === 'accept'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {responseData.action === 'accept' ? 'Accept Offer' : 'Send Counter Offer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NegotiationModal;