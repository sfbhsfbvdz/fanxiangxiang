-- 饭否初始数据
-- 基于 client/src/data/mockData.ts 生成

-- 餐厅数据
INSERT INTO restaurants (id, name, description, image, rating, delivery_time, delivery_fee, min_order, status) VALUES
(1, '一食堂 - 川湘风味', '正宗川湘风味，麻辣鲜香', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', 4.8, '20-30 分钟', 0.00, 10.00, 'active'),
(2, '校园水果站', '新鲜水果，现切现卖', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', 4.9, '15-20 分钟', 1.00, 15.00, 'active'),
(3, '二食堂 - 面食档', '手工面食，汤鲜味美', 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80', 4.6, '25-35 分钟', 0.00, 12.00, 'active'),
(4, '教育超市', '零食饮料日用品，应有尽有', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80', 4.7, '10-20 分钟', 2.00, 0.00, 'active');

-- 餐厅标签
INSERT INTO restaurant_tags (restaurant_id, tag) VALUES
(1, '川菜'), (1, '湘菜'), (1, '盖浇饭'),
(2, '新鲜水果'), (2, '果切'), (2, '果汁'),
(3, '拉面'), (3, '水饺'), (3, '刀削面'),
(4, '零食'), (4, '饮料'), (4, '日用品');

-- 分类数据
INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES
-- 一食堂分类
(1, 1, '热销', 1),
(2, 1, '盖浇饭', 2),
(3, 1, '小炒', 3),
-- 校园水果站分类
(4, 2, '时令水果', 1),
(5, 2, '鲜榨果汁', 2),
-- 二食堂分类
(6, 3, '面条', 1),
(7, 3, '水饺', 2),
-- 教育超市分类
(8, 4, '饮料', 1),
(9, 4, '零食', 2);

-- 菜品数据
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image, status) VALUES
-- 一食堂菜品
(1, 1, 1, '宫保鸡丁盖饭', '经典川菜，花生米酥脆，鸡肉嫩滑。', 15.00, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80', 'available'),
(2, 1, 2, '农家小炒肉', '青椒炒肉，下饭神器。', 18.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', 'available'),
(3, 1, 3, '番茄鸡蛋汤', '酸甜开胃，营养均衡。', 5.00, 'https://images.unsplash.com/photo-1547592166-23acbe3a624b?w=400&q=80', 'available'),
-- 校园水果站菜品
(4, 2, 4, '鲜切西瓜盒', '现切无籽西瓜，清凉解暑。', 12.00, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', 'available'),
(5, 2, 5, '鲜榨橙汁', '100%纯果汁，无添加。', 15.00, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80', 'available'),
-- 二食堂菜品
(6, 3, 6, '红烧牛肉面', '大块牛肉，汤浓味美。', 16.00, 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&q=80', 'available'),
(7, 3, 7, '猪肉白菜水饺', '手工现包，皮薄馅大。', 14.00, 'https://images.unsplash.com/photo-1496116218417-1a781b1c423c?w=400&q=80', 'available'),
-- 教育超市商品
(8, 4, 8, '可口可乐 (330ml)', '冰镇快乐水。', 3.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', 'available'),
(9, 4, 9, '乐事薯片', '原味，大包。', 8.50, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', 'available');
