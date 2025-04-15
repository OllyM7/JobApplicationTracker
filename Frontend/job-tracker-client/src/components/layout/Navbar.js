import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import PageTitle from './PageTitle';

const UserMenu = () => {
  const { user, logout } = React.useContext(AuthContext);
  
  if (!user) return null;
  
  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <span className="sr-only">Open user menu</span>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block ml-2 text-sm text-gray-700">{user.email}</span>
            <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-500" />
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/profile"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700 flex items-center`}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Your Profile
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/settings"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700 flex items-center`}
              >
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={logout}
                className={`${
                  active ? 'bg-gray-100' : ''
                } block w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center`}
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const Navbar = () => {
  const { isAuthenticated } = React.useContext(AuthContext);
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {isAuthenticated() && <PageTitle />}
            {!isAuthenticated() && (
              <Link to="/" className="text-xl font-semibold text-primary-600">
                Job Tracker
              </Link>
            )}
          </div>
          
          <div className="flex items-center">
            {isAuthenticated() ? (
              <UserMenu />
            ) : (
              <div className="space-x-4">
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  Sign in
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm font-medium bg-primary-600 py-2 px-4 rounded text-white hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 