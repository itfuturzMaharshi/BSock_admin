import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import Logo from "../components/common/Logo";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <i className="fas fa-th-large"></i>,
    name: "Dashboard",
    path: "/home",
    // subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },

  {
    icon: <i className="fas fa-user-shield"></i>,
    name: "Admins",
    path: "/admin",
  },
  {
    icon: <i className="fas fa-users"></i>,
    name: "Customers",
    path: "/customers",
  },
  {
    icon: <i className="fas fa-exchange-alt"></i>,
    name: "Currency Conversion",
    path: "/currency-conversion",
  },
  {
    icon: <i className="fa-solid fa-building"></i>,
    name: "Business Requests",
    path: "/business-requests",
  },
  {
    icon: <i className="fas fa-tags"></i>,
    name: "Sku Family",
    path: "/sku-family",
  },

  {
    icon: <i className="fas fa-box-open"></i>,
    name: "Products",
    path: "/products",
  },
  {
    icon: <i className="fas fa-box-open"></i>,
    name: "Orders",
    path: "/orders",
  },
  {
    icon: <i className="fa-solid fa-list-check"></i>,
    name: "Activities",
    path: "/activities",
  },
  {
    icon: <i className="fas fa-cog"></i>,
    name: "Configuration",
    subItems: [
      { name: "Payment Config", path: "/payments" },
      { name: "Cost Config", path: "/cost-module" },
      // { name: "Notification Config", path: "#" },
    ],
  },
  {
    icon: <i className="fas fa-wallet"></i>,
    name: "Wallet Amount",
    path: "/wallet-amount",
  },
  {
    icon: <i className="fas fa-cart-shopping"></i>,
    name: "Customer Cart",
    path: "/customer-cart",
  },
  {
    icon: <i className="fas fa-gavel"></i>,
    name: "Bid Products",
    path: "/bid-products",
  },
  // {
  //   icon: <i className="fas fa-search-location"></i>,
  //   name: "Bid Tracking",
  //   path: "/bid-tracking",
  // },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main") => (
    <ul className="flex flex-col gap-3">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group flex items-center ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size w-6 h-6 flex items-center justify-center ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text text-base ml-2">
                  {nav.name}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <i
                  className={`ml-auto w-5 h-5 transition-transform duration-200 fas fa-chevron-down flex items-center justify-center ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group flex items-center ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size w-8 h-8 flex items-center justify-center text-base ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text text-base ml-2">
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 space-y-1 ml-8">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item text-sm ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[268px]"
            : isHovered
            ? "w-[270px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <>
          {isExpanded || isHovered || isMobileOpen ? (
            <Logo showTagline={true} size="medium" variant="sidebar" />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(to bottom right, #0071E0, #005bb5)' }}
            >
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}
        </>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-5">
          <div className="flex flex-col gap-3">
            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[18px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <i className="fas fa-ellipsis-h size-6"></i>
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
