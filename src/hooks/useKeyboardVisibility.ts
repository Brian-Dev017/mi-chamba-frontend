import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform, useWindowDimensions } from "react-native";

export function useKeyboardVisibility() {
  const [isKeyboardEventVisible, setKeyboardEventVisible] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = Dimensions.get("screen").height;
  const isAndroidWindowResized = Platform.OS === "android" && screenHeight - windowHeight > 120;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardEventVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardEventVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardEventVisible || isAndroidWindowResized;
}
