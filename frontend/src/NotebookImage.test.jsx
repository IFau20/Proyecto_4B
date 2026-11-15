import {expect,it,vi} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import NotebookImage from "./NotebookImage.jsx";
it("always attempts the same-origin SKU photo even if no retailer image URL was found",()=>{
 const product={sku:"82XM00M4CL",name:"Lenovo IdeaPad Slim 3",imageUrl:null};
 const {container}=render(<NotebookImage product={product}/>);
 const img=container.querySelector("img");
 expect(img).not.toBeNull();
 expect(img).toHaveAttribute("src","/api/notebook-image?sku=82XM00M4CL");
 fireEvent.error(img);
 expect(screen.getByRole("img",{name:"Lenovo IdeaPad Slim 3"})).toBeInTheDocument();
});
