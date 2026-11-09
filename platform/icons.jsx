import {
  FaAlignRight,
  FaCog,
  FaFireAlt,
  FaGripLines,
  FaHistory,
  FaListAlt,
  FaMagic,
  FaPaperPlane,
  FaPlus,
  FaPlusSquare,
  FaUser,
  FaUserCircle,
} from 'react-icons/fa';
import { flattenStyle } from './styles';

const ICONS = {
  'user-circle': FaUserCircle,
  'plus-square': FaPlusSquare,
  'align-right': FaAlignRight,
  user: FaUser,
  cog: FaCog,
  'paper-plane': FaPaperPlane,
  'fire-alt': FaFireAlt,
  'grip-lines': FaGripLines,
  magic: FaMagic,
  'list-alt': FaListAlt,
  history: FaHistory,
  plus: FaPlus,
};

export default function FontAwesome5({ name, style }) {
  const Icon = ICONS[name] || FaPlus;
  const css = flattenStyle(style) || {};
  const size = typeof css.fontSize === 'number' ? css.fontSize : 16;
  return <Icon size={size} color={css.color || 'currentColor'} style={css} />;
}
