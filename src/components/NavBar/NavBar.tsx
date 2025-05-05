import shot_gobbler from "../../assets/shot_gobbler.svg";

type NavBarProps = {
  activeTab: "shots" | "touches";
  setActiveTab: (tab: "shots" | "touches") => void;
};

const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  return (
    <nav className="sticky top-0 right-0 left-0 z-10 flex h-15 w-full bg-gray-100 shadow-md">
      <div className="flex flex-1 cursor-pointer flex-col justify-center">
        <img src={shot_gobbler} alt="Shot Gobbler" className="h-20 w-25" />
      </div>
      <div className="flex flex-1 cursor-pointer flex-row items-center justify-center text-gray-500">
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
      </div>
    </nav>
  );
};

export default NavBar;
