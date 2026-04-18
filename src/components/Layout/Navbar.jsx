import { Menu, User, ShoppingCart, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import {toggleSidebar, toggleSearchBar, toggleAuthPopup, toggleCart} from "../../store/slices/popupSlice"

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();

    const {cart} = useSelector((state) => state.cart);

    let cartItemsCounts = 0;

    if(cart){
        cartItemsCounts = cart.reduce((total, item) => total + item.quantity, 0);
    }
  return (
    <>
    <nav className="fixed left-0 top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md" >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left Hanmburger button*/}
          <button onClick={() => dispatch(toggleSidebar())} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Menu size={24} className="w-6 h-6 text-background" />
          </button>
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold text-primary">ShopMate</h1>
            </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              {theme === "light" ? <Sun size={24} className="w-6 h-6 text-foreground" /> : <Moon size={24} className="w-6 h-6 text-foreground" />}
            </button>

            { /* Search Icon */}
            <button onClick = {() => dispatch(toggleSearchBar())} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Search size={24} className="w-6 h-6 text-foreground" />
            </button>

            {/* User Icon */}
            <button onClick= {() => dispatch(toggleAuthPopup())}className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <User size={24} className="w-6 h-6 text-foreground" />
            </button>

            {/* Cart Icon */}
            <button onClick= {() => dispatch(toggleCart())}className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <ShoppingCart size={24} className="w-6 h-6 text-foreground" />
              {
                cartItemsCounts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCounts}
                  </span>
                )
              }
            </button>
              </div>
          </div>
        
        </div>
    </nav>
  </>  
  )
};

export default Navbar;
