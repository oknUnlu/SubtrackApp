import { StyleSheet } from 'react-native';


// Explore screen disabled — kept for reference but not exported as default
export function _explore_disabled_for_removal() {
  return null;
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
