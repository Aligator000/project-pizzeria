import {classNames, templates} from '../settings.js';
import {select} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';

export class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    //console.log(id);
    thisProduct.data = data;
    //console.log(data);

    thisProduct.renderInMenu();
    thisProduct.getElements();
    //console.log(thisProduct.accordionTrigger);
    //console.log(thisProduct.form);
    //console.log(thisProduct.formInputs);
    //console.log(thisProduct.cartButton);
    //console.log(thisProduct.priceElem);
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    //console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;
    //generate HTML based on tamplate
    const generatedHTML = templates.menuProduct(thisProduct.data);
    //console.log(generatedHTML);

    /*create element isug utils.createElementFrom HTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /*add element to menu*/
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelectorAll(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;
    /* find the clickable trigger (the element that should react to clicking) */
    let clickElem = thisProduct.accordionTrigger;
    //console.log(clickElem);
    /* START: click event listener to trigger */
    clickElem.addEventListener('click', function(){
      //console.log('clicked', clickElem);
      /* prevent default action for event */
      event.preventDefault();
      /* toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle('active');
      /* find all active products */
      const arctivElems = document.querySelectorAll('.product.active');
      //console.log(arctivElems);
      /* START LOOP: for each active product */
      for (let activElem of arctivElems){
      /* START: if the active product isn't the element of thisProduct */
        if(activElem != thisProduct.element){
          /* remove class active for the active product */
          activElem.classList.remove('active');
          //console.log(activElem);
          /* END: if the active product isn't the element of thisProduct */
        }
        /* END LOOP: for each active product */
      }
      /* END: click event listener to trigger */
    });
  }

  initOrderForm(){
    const thisProduct = this;
    //console.log('initOrderForm');

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    //console.log('processOrder');

    /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
    const formData = utils.serializeFormToObject(thisProduct.form);
    // console.log('formData', formData);

    /* set variable price to equal thisProduct.data.price */
    thisProduct.params = {};
    let price = thisProduct.data.price;

    /* START LOOP: for each paramId in thisProduct.data.params */
    for(let paramId in thisProduct.data.params){
      /* save the element in thisProduct.data.params with key paramId as const param */
      const param = thisProduct.data.params[paramId];
      //console.log('params:', param);
      /* START LOOP: for each optionId in param.options */
      for(let optionId in param.options){
        /* save the element in param.options with key optionId as const option */
        const option = param.options[optionId];
        /* START IF: if option is selected and option is not default */
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        if(optionSelected && !option.default){
          /* add price of option to variable price */
          price = price + option.price;
          /* END IF: if option is selected and option is not default */
        }
        /* START ELSE IF: if option is not selected and option is default */
        else if(!optionSelected && option.default){
          /* deduct price of option from price */
          price = price - option.price;
          /* END ELSE IF: if option is not selected and option is default */
        }
        const selectImages = document.querySelectorAll('.' + paramId + '-' + optionId);
        //console.log(selectImages);

        if(optionSelected){
          if(!thisProduct.params[paramId]){
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId]=option.label;
          for(let sglImage of selectImages){
            sglImage.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          for(let sglImage of selectImages){
            sglImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
        /* END LOOP: for each optionId in param.options */
      }
      /* END LOOP: for each paramId in thisProduct.data.params */
    }
    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    thisProduct.priceElem.innerHTML = thisProduct.price;
    //console.log(thisProduct.params);
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('click', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;
    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;
    //app.cart.add(thisProduct);

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}
