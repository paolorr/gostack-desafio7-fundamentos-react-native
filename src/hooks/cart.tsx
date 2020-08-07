import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const STORAGE_KEY_PRODUCTS = '@GoMarketplace_products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem(STORAGE_KEY_PRODUCTS);

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }

    loadProducts();
  }, []);

  async function saveProducts(updatedProducts: Product[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEY_PRODUCTS,
      JSON.stringify(updatedProducts),
    );
    setProducts(updatedProducts);
  }

  const addToCart = useCallback(
    async product => {
      const currentProducts = [...products];
      const index = currentProducts.findIndex(item => item.id === product.id);

      if (index === -1) {
        currentProducts.push({ ...product, quantity: 1 });
      } else {
        currentProducts[index].quantity += 1;
      }

      await saveProducts(currentProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const currentProducts = [...products];
      const index = currentProducts.findIndex(item => item.id === id);

      if (index >= 0) {
        currentProducts[index].quantity += 1;
      }

      await saveProducts(currentProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const currentProducts = [...products];
      const index = currentProducts.findIndex(item => item.id === id);

      if (index >= 0) {
        currentProducts[index].quantity -= 1;
      }

      if (currentProducts[index].quantity <= 0) {
        currentProducts.splice(index, 1);
      }

      await saveProducts(currentProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
