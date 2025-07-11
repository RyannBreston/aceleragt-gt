import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="75"
      height="45"
      viewBox="0 0 258 155"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          .super-text {
            font-size: 75px;
            fill: #e54d6e;
            font-family: Montserrat, sans-serif;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .moda-text {
            font-size: 75px;
            fill: #5b67ae;
            font-family: Montserrat, sans-serif;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .calcados-text {
            font-size: 25px;
            fill: #646464;
            font-family: Montserrat, sans-serif;
            font-weight: 400;
          }
        `}
      </style>
      <text y="65" className="super-text">
        super
      </text>
      <text y="130" className="moda-text">
        moda
      </text>
      <text x="85" y="152" className="calcados-text">
        calçados
      </text>
    </svg>
  );
};
