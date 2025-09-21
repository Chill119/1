export interface Product {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const products: Product[] = [
  {
    priceId: 'price_1RdlLJLxhqoVS5m4VNtyT5y2',
    name: 'DBTK Token',
    description: 'DigiBank Membership Tokens',
    mode: 'payment',
    price: 100.00,
    currency: 'USD'
  }
];

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};

export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};