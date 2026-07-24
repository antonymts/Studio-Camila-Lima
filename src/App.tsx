import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Header } from './components/public/Header';
import { Hero } from './components/public/Hero';
import { ServicesCatalog } from './components/public/ServicesCatalog';
import { BookingModal } from './components/public/BookingModal';
import { GallerySection } from './components/public/GallerySection';
import { PoliciesSection } from './components/public/PoliciesSection';
import { LocationContact } from './components/public/LocationContact';
import { Footer } from './components/public/Footer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPanel } from './components/admin/AdminPanel';

import {
  Service,
  BusinessHours,
  BlockedSlot,
  StudioProfile,
  StudioPolicies,
  GalleryItem,
} from './types';
import {
  seedInitialDataIfNeeded,
  getServices,
  getBusinessHours,
  getBlockedSlots,
  getStudioProfile,
  getStudioPolicies,
  getGalleryItems,
  defaultProfile,
  defaultBusinessHours,
  defaultPolicies,
} from './services/db';

function MainApp() {
  const { isAdmin } = useAuth();

  const [profile, setProfile] = useState<StudioProfile>(defaultProfile);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [policies, setPolicies] = useState<StudioPolicies>(defaultPolicies);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    try {
      await seedInitialDataIfNeeded();
      await loadPublicData();
    } catch (err) {
      console.error('Error initializing app:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicData = async () => {
    try {
      const [profData, servData, hoursData, blocksData, polData, galData] = await Promise.all([
        getStudioProfile(),
        getServices(),
        getBusinessHours(),
        getBlockedSlots(),
        getStudioPolicies(),
        getGalleryItems(),
      ]);

      setProfile(profData);
      setServices(servData);
      setBusinessHours(hoursData);
      setBlockedSlots(blocksData);
      setPolicies(polData);
      setGallery(galData);
    } catch (err) {
      console.error('Error loading public data:', err);
    }
  };

  const handleOpenBookingForService = (service: Service) => {
    setBookingService(service);
    setIsBookingOpen(true);
  };

  const handleOpenBookingGeneral = () => {
    setBookingService(null);
    setIsBookingOpen(true);
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-[#1A1A1A] font-sans selection:bg-[#C2A482] selection:text-white">
      {/* Public Site Header */}
      <Header
        profile={profile}
        onOpenBooking={handleOpenBookingGeneral}
        onOpenAdmin={handleAdminClick}
      />

      {/* Main Public Content */}
      <main>
        <Hero profile={profile} onOpenBooking={handleOpenBookingGeneral} />

        <ServicesCatalog
          services={services}
          onSelectService={handleOpenBookingForService}
        />

        <GallerySection gallery={gallery} />

        <PoliciesSection policies={policies} />

        <LocationContact profile={profile} />
      </main>

      {/* Public Site Footer */}
      <Footer profile={profile} onOpenAdmin={handleAdminClick} />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialService={bookingService}
        services={services}
        businessHours={businessHours}
        blockedSlots={blockedSlots}
        profile={profile}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setIsAdminPanelOpen(true)}
      />

      {/* Full Administrative Panel */}
      {isAdminPanelOpen && isAdmin && (
        <AdminPanel
          onClose={() => setIsAdminPanelOpen(false)}
          onRefreshPublicData={loadPublicData}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
