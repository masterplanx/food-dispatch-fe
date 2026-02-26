import type { FC } from 'react';

interface IconProps {
  className?: string;
}

export const CakeIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2"/>
    <path d="M12 11v-1"/>
    <path d="M12 7V6"/>
    <path d="M12 16v-1"/>
  </svg>
);

export const CookieIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10 10.011 10.011 0 0 0-10-10z" />
    <path d="M8.5 8.5a1.5 1.5 0 0 1 0-3 1.5 1.5 0 0 1 0 3z" />
    <path d="M15.5 15.5a1.5 1.5 0 0 1 0-3 1.5 1.5 0 0 1 0 3z" />
    <path d="M8 15.5a1.5 1.5 0 0 1 3 0 1.5 1.5 0 0 1-3 0z" />
    <path d="M15.5 8a1.5 1.5 0 0 1 0 3 1.5 1.5 0 0 1 0-3z" />
  </svg>
);

export const CupcakeIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 14.5a2.5 2.5 0 0 1-5 0V10h5v4.5z" />
    <path d="M15.5 10H18a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-2.5" />
    <path d="M8.5 10H6a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1h2.5" />
    <path d="m7 17 1 3h8l1-3" />
    <path d="m12 4 1.5 1.5" />
    <path d="m12 4-1.5 1.5" />
  </svg>
);
