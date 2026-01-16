export type TabType = 'mobile' | 'email' | 'club_code';

interface AccessTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function AccessTabs({ activeTab, onTabChange }: AccessTabsProps) {
  return (
    <div 
      className={`flex gap-0 mb-6 bg-gray-100 rounded-[6px] h-[40px] items-center bc-tabs-container ${
        activeTab === 'mobile' ? 'bc-tab-mobile-active' :
        activeTab === 'email' ? 'bc-tab-email-active' :
        'bc-tab-club-active'
      }`}
    >
      <button
        type="button"
        onClick={() => onTabChange('mobile')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all bc-tab-mobile ${
          activeTab === 'mobile'
            ? 'bc-active-tab'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
        }`}
      >
        Mobile
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="currentColor" stroke="currentColor" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 18H12.01M7 2H17C18.1046 2 19 2.89543 19 4V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4C5 2.89543 5.89543 2 7 2Z" />
        </svg>
      </button>
      {/* Left separator - hidden when Mobile or Email tab is active */}
      {activeTab !== 'mobile' && activeTab !== 'email' && (
        <div className="w-[1px] h-[34px] bg-[rgba(0,0,45,0.0902)]" />
      )}
      <button
        type="button"
        onClick={() => onTabChange('email')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all bc-tab-email ${
          activeTab === 'email'
            ? 'bc-active-tab'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
        }`}
      >
        <span>Email</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="currentColor" stroke="currentColor" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 7L13.009 12.727C12.7039 12.9042 12.3573 12.9976 12.0045 12.9976C11.6517 12.9976 11.3051 12.9042 11 12.727L2 7M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4Z" />
        </svg>
      </button>
      {/* Right separator - hidden when Email or Club code tab is active */}
      {activeTab !== 'email' && activeTab !== 'club_code' && (
        <div className="w-[1px] h-[34px] bg-[rgba(0,0,45,0.0902)]" />
      )}
      <button
        type="button"
        onClick={() => onTabChange('club_code')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all bc-tab-club ${
          activeTab === 'club_code'
            ? 'bc-active-tab'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
        }`}
      >
        <span>Club code</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="currentColor" stroke="currentColor" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H7M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V7M21 17V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H17M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V17M7 12H17" />
        </svg>
      </button>
    </div>
  );
}
