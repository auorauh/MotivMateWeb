import { Text } from '../platform';

const TextFont = ({ style, children, ...rest }) => {
  return (
    <Text {...rest} style={[style, { fontFamily: 'Montserrat, sans-serif' }]}>
      {children}
    </Text>
  );
};

export default TextFont;
