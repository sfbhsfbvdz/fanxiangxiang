import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image: string;
  tags: string[];
  categories: Category[];
  menu: MenuItem[];
}

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: '一食堂 - 川湘风味',
    rating: 4.8,
    deliveryTime: '20-30 分钟',
    deliveryFee: 0,
    minOrder: 10.00,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    tags: ['川菜', '湘菜', '盖浇饭'],
    categories: [
      { id: 'c1', name: '热销' },
      { id: 'c2', name: '盖浇饭' },
      { id: 'c3', name: '小炒' },
    ],
    menu: [
      {
        id: 'm1',
        name: '宫保鸡丁盖饭',
        description: '经典川菜，花生米酥脆，鸡肉嫩滑。',
        price: 15.00,
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80',
        categoryId: 'c1',
      },
      {
        id: 'm2',
        name: '农家小炒肉',
        description: '青椒炒肉，下饭神器。',
        price: 18.00,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
        categoryId: 'c2',
      },
      {
        id: 'm3',
        name: '番茄鸡蛋汤',
        description: '酸甜开胃，营养均衡。',
        price: 5.00,
        image: 'https://images.unsplash.com/photo-1547592166-23acbe3a624b?w=400&q=80',
        categoryId: 'c3',
      },
    ],
  },
  {
    id: '2',
    name: '校园水果站',
    rating: 4.9,
    deliveryTime: '15-20 分钟',
    deliveryFee: 1.00,
    minOrder: 15.00,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
    tags: ['新鲜水果', '果切', '果汁'],
    categories: [
      { id: 'c1', name: '时令水果' },
      { id: 'c2', name: '鲜榨果汁' },
    ],
    menu: [
      {
        id: 'm4',
        name: '鲜切西瓜盒',
        description: '现切无籽西瓜，清凉解暑。',
        price: 12.00,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
        categoryId: 'c1',
      },
      {
        id: 'm5',
        name: '鲜榨橙汁',
        description: '100%纯果汁，无添加。',
        price: 15.00,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
        categoryId: 'c2',
      },
    ],
  },
  {
    id: '3',
    name: '二食堂 - 面食档',
    rating: 4.6,
    deliveryTime: '25-35 分钟',
    deliveryFee: 0,
    minOrder: 12.00,
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
    tags: ['拉面', '水饺', '刀削面'],
    categories: [
      { id: 'c1', name: '面条' },
      { id: 'c2', name: '水饺' },
    ],
    menu: [
      {
        id: 'm6',
        name: '红烧牛肉面',
        description: '大块牛肉，汤浓味美。',
        price: 16.00,
        image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&q=80',
        categoryId: 'c1',
      },
      {
        id: 'm7',
        name: '猪肉白菜水饺',
        description: '手工现包，皮薄馅大。',
        price: 14.00,
        image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c423c?w=400&q=80',
        categoryId: 'c2',
      },
    ],
  },
  {
    id: '4',
    name: '教育超市',
    rating: 4.7,
    deliveryTime: '10-20 分钟',
    deliveryFee: 2.00,
    minOrder: 0,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    tags: ['零食', '饮料', '日用品'],
    categories: [
      { id: 'c1', name: '饮料' },
      { id: 'c2', name: '零食' },
    ],
    menu: [
      {
        id: 'm8',
        name: '可口可乐 (330ml)',
        description: '冰镇快乐水。',
        price: 3.00,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
        categoryId: 'c1',
      },
      {
        id: 'm9',
        name: '乐事薯片',
        description: '原味，大包。',
        price: 8.50,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
        categoryId: 'c2',
      },
    ],
  },
];
