import shot_gobbler from "../../assets/shot_gobbler.svg";

type NavBarProps = {
  activeTab: "docs" | "shots" | "touches" | "pass-chains";
  setActiveTab: (tab: "docs" | "shots" | "touches" | "pass-chains") => void;
};

const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  return (
    <nav className="sticky top-0 right-0 left-0 z-10 flex h-15 w-full bg-gray-100 shadow-md">
      <div
        className="flex flex-1 cursor-pointer flex-col justify-center"
        onClick={() => setActiveTab("docs")}
      >
        <img src={shot_gobbler} alt="Shot Gobbler" className="h-20 w-25" />
      </div>
      <div className="flex flex-1 cursor-pointer flex-row items-center justify-center text-gray-500">
        <div
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
            activeTab === "docs" ? "font-bold text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("docs")}
        >
          <span className="mb-1 text-2xl">📖</span>
          <span className="text-xs">Docs</span>
        </div>
        <div
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
            activeTab === "shots" ? "font-bold text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("shots")}
        >
          <span className="mb-1 text-2xl">⚽</span>
          <span className="text-xs">Shots</span>
        </div>
        <div
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
            activeTab === "touches"
              ? "font-bold text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("touches")}
        >
          <span className="mb-1 text-2xl">👟</span>
          <span className="text-xs">Touches</span>
        </div>
        <div
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
            activeTab === "pass-chains"
              ? "font-bold text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("pass-chains")}
        >
          <span className="mb-1 text-2xl">🔗</span>
          <span className="text-xs">Chains</span>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
