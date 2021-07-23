
console.log(cartCopy);


const calculateTotal = function (total) {
console.log(total);
document.querySelector('#subTotal').innerText = `Rs.${total}/-`;
document.querySelector('#tax').innerText = `Rs.${total/100}/-`;
document.querySelector('#total').innerText = `Rs.${total + total/100}/-`;
}

const checkedProducts = document.querySelectorAll('.chk');

for(let i=0; i<checkedProducts.length;i++){
    checkedProducts[i].addEventListener('change', function() {

        let total = 0;
        for(let j=0;j<checkedProducts.length;j++)
         {
        const pr = parseInt(cartCopy[j].price);
        const qty = parseInt(cartCopy[j].qty);
        if (checkedProducts[j].checked) {
            total+= pr*qty;
        } 
        }
        calculateTotal(total);
      });
  }
