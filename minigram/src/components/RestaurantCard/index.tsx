import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Restaurant } from '../../types'
import './index.scss'

interface Props {
  restaurant: Restaurant
}

export default function RestaurantCard({ restaurant }: Props) {
  const handleClick = () => {
    Taro.navigateTo({ url: `/pages/restaurant/index?id=${restaurant.id}` })
  }

  return (
    <View className="restaurant-card" onClick={handleClick}>
      <Image
        className="restaurant-card__img"
        src={restaurant.image || 'https://via.placeholder.com/120x80?text=餐厅'}
        mode="aspectFill"
      />
      <View className="restaurant-card__info">
        <Text className="restaurant-card__name">{restaurant.name}</Text>
        {restaurant.description && (
          <Text className="restaurant-card__desc">{restaurant.description}</Text>
        )}
        <View className="restaurant-card__meta">
          <View className="restaurant-card__rating">
            <Text className="restaurant-card__rating-star">★</Text>
            <Text className="restaurant-card__rating-val">{restaurant.rating?.toFixed(1) || '5.0'}</Text>
          </View>
          <Text className="restaurant-card__divider">·</Text>
          <Text className="restaurant-card__time">{restaurant.deliveryTime}</Text>
          <Text className="restaurant-card__divider">·</Text>
          <Text className="restaurant-card__fee">
            {restaurant.deliveryFee === 0 ? '免配送费' : `¥${restaurant.deliveryFee}配送`}
          </Text>
        </View>
        <View className="restaurant-card__tags">
          {Array.isArray(restaurant.tags) &&
            restaurant.tags.slice(0, 3).map((tag, idx) => (
              <Text key={idx} className="restaurant-card__tag">
                {tag}
              </Text>
            ))}
          <Text className="restaurant-card__min-order">起送¥{restaurant.minOrder}</Text>
        </View>
      </View>
    </View>
  )
}
