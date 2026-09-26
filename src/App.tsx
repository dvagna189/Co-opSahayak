import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { VoiceAssistantModal } from './components/Voice/VoiceAssistantModal';
import { DocumentUploadModal } from './components/Documents/DocumentUploadModal';
import { SourceCitationModal } from './components/Common/SourceCitationModal';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';

// Pages
import { Home } from './pages/Home';
import { AskAssistant } from './pages/AskAssistant';
import { GuidedTasks } from './pages/GuidedTasks';
import { MyRights } from './pages/MyRights';
import { GrievanceFlow } from './pages/GrievanceFlow';
import { GrievanceLetterView } from './pages/GrievanceLetterView';
import { KnowledgeSources } from './pages/KnowledgeSources';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'ask':
        return <AskAssistant />;
      case 'guided':
        return <GuidedTasks />;
      case 'rights':
        return <MyRights />;
      case 'grievance':
        return <GrievanceFlow />;
      case 'letter-view':
        return <GrievanceLetterView />;
      case 'knowledge':
        return <KnowledgeSources />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 antialiased overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-900 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto bg-slate-100">
          {renderActivePage()}
        </main>
      </div>

      {/* Multilingual Voice Assistant Modal - Mounted globally */}
      <VoiceAssistantModal />

      {/* Document Upload & Q&A Modal - Mounted globally */}
      <DocumentUploadModal />

      {/* Citation Inspection Modal */}
      <SourceCitationModal />

      {/* Onboarding Dialog on first use */}
      <OnboardingModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
