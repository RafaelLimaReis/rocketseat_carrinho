import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const currentCart = [...cart];
      const productExistsCart = currentCart.find(product => product.id === productId);

      const { data } = await api.get(`stock/${productId}`);
      const currentAmount = productExistsCart ? productExistsCart.amount : 0;
      const amount = currentAmount + 1;

      if (data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExistsCart) {
        productExistsCart.amount = amount;
      } else {
        const productResponse = await api.get(`products/${productId}`);
        const newProduct = {
          ...productResponse.data,
          amount: 1
        };
        currentCart.push(newProduct);
      }
      setCart(currentCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let currentCart = [...cart];
      const productIndex = currentCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        currentCart.splice(productIndex, 1);
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw Error();
      }
    } catch {
      return toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const { data: stockProduct } = await api.get(`stock/${productId}`);
      if (stockProduct.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const currentCart = [...cart];
      const productFiltered = currentCart.find(product => product.id === productId);

      if (productFiltered) {
        productFiltered.amount = amount;
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
