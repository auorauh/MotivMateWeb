import {
  FaAlignRight,
  FaArchive,
  FaBook,
  FaBookmark,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaFireAlt,
  FaGripLines,
  FaHistory,
  FaListAlt,
  FaMagic,
  FaPaperPlane,
  FaPencilAlt,
  FaPlus,
  FaPlusSquare,
  FaRedo,
  FaRegBookmark,
  FaShoppingCart,
  FaTrash,
  FaUser,
  FaUserCircle,
  FaUtensils,
} from 'react-icons/fa';
import { flattenStyle } from './styles';

const ICONS = {
  'user-circle': FaUserCircle,
  'plus-square': FaPlusSquare,
  'align-right': FaAlignRight,
  'chevron-left': FaChevronLeft,
  'chevron-right': FaChevronRight,
  utensils: FaUtensils,
  book: FaBook,
  redo: FaRedo,
  check: FaCheck,
  user: FaUser,
  cog: FaCog,
  'paper-plane': FaPaperPlane,
  'pencil-alt': FaPencilAlt,
  'fire-alt': FaFireAlt,
  'grip-lines': FaGripLines,
  magic: FaMagic,
  'list-alt': FaListAlt,
  history: FaHistory,
  plus: FaPlus,
  trash: FaTrash,
  bookmark: FaBookmark,
  'bookmark-o': FaRegBookmark,
  archive: FaArchive,
  'shopping-cart': FaShoppingCart,
};

export default function FontAwesome5({ name, style }) {
  const Icon = ICONS[name] || FaPlus;
  const css = flattenStyle(style) || {};
  const size = typeof css.fontSize === 'number' ? css.fontSize : 16;
  const color = css.color || 'currentColor';
  return <Icon size={size} color={color} style={css} />;
}
