import shot_gobbler from "../../assets/shot_gobbler.svg";
import { Tab } from "../../types/Tab";

type NavBarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "docs", icon: "📖", label: "Docs" },
  { id: "shots", icon: "⚽", label: "Shots" },
  { id: "touches", icon: "👟", label: "Touches" },
  { id: "pass-chains", icon: "🔗", label: "Chains" },
];

const focusRing =
  "rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none";

const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  return (
    <header className="sticky top-0 right-0 left-0 z-10 flex h-15 w-full bg-gray-100 shadow-md">
      <button
        type="button"
        aria-label="Shot Gobbler – home"
        className={`flex flex-1 cursor-pointer flex-col justify-center border-0 bg-transparent p-0 ${focusRing}`}
        onClick={() => setActiveTab("docs")}
      >
        <img src={shot_gobbler} alt="" className="h-20 w-25" />
      </button>
      <nav
        aria-label="Main"
        className="flex flex-1 flex-row items-center justify-center text-gray-500"
      >
        {TABS.map(({ id, icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center border-0 bg-transparent p-0 ${focusRing} ${
                isActive ? "font-bold text-blue-500" : "text-gray-500"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <span aria-hidden="true" className="mb-1 text-2xl">
                {icon}
              </span>
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default NavBar;
