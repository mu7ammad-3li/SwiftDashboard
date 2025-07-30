export interface Customer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  secondPhone?: string;
  address: {
    governorate: string; // Keep it as it is : will be a dropdown list of all gouverments of egypt in arabic
    city: string; // Keep it as it is :will be a dropdown list of all cities in goverment selected of egypt in arabic
    landMark: string;
    fullAdress: string;
  };
  status?: "active" | "archived";
}
