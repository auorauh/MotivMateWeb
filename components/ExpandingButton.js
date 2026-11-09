import { useState } from 'react';
import { View, TouchableOpacity, Animated } from '../platform';

function ExpandingButton() {
  const [expanded, setExpanded] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePress = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(scaleValue, {
      toValue: next ? 2 : 1,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity onPress={handlePress}>
          <View style={{ backgroundColor: 'blue', padding: 20, borderRadius: 10 }} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default ExpandingButton;
