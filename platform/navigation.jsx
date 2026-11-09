import { createContext, useContext, useState } from 'react';

const NavigationContext = createContext(null);

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationContainer({ children }) {
  return children;
}

function Navigator({ children }) {
  const screens = Array.isArray(children) ? children : [children];
  const [stack, setStack] = useState(() => [{ name: screens[0].props.name, params: undefined }]);
  const current = stack[stack.length - 1];
  const screen = screens.find((item) => item.props.name === current.name) || screens[0];
  const Component = screen.props.component;

  const navigation = {
    navigate(name, params) {
      setStack((prev) => [...prev, { name, params }]);
    },
    goBack() {
      setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    },
  };

  return (
    <NavigationContext.Provider value={navigation}>
      <Component navigation={navigation} route={{ name: current.name, params: current.params }} />
    </NavigationContext.Provider>
  );
}

function Screen() {
  return null;
}

export function createNativeStackNavigator() {
  return { Navigator, Screen };
}
