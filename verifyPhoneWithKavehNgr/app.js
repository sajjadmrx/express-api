
const express = require('express')();
const bodyParser = require('body-parser');
const NodeCache = require("node-cache");
var Kavenegar = require('kavenegar');


const phoneCache = new NodeCache();


var api = Kavenegar.KavenegarApi({
    apikey: process.env.KAVENEGAR_API_KEY
});

class application {

    constructor() {
        this.startServer()
        this.configServer()
        this.routers()
    }

    startServer() {
        express.listen(3000, () => {
            console.log('Server is running on port 3000');
        })
    }


    configServer() {
        express.use(bodyParser.json());
        express.use(bodyParser.urlencoded({ extended: false }));
    }



    routers() {

        express.get('/', (req, res) => {
            res.send('Hello World!');
        })


        express.post('/verify-phone', async (req, res) => {
            try {
                const phone = req.body.phone;
                if (!phone)
                    this.error('شماره  همراه الزامیست', 400)



                const result = await this.sendVrefyMsg(phone)



                phoneCache.set(phone, result.code, 3600)



                res.status(200).json({
                    success: true,
                    message: `پیام حاوی کد تایید به شماره ${phone} ارسال شد`,
                })




            } catch (error) {

                const status = error.status || 500;
                res.status(status).json({
                    success: false,
                    message: error.message
                })
            }
        })



        express.post('/verify-phone/code', async (req, res) => {
            try {
                const phone = req.body.phone;
                const code = req.body.code;
                if (!phone || !code)
                    this.error('شماره  همراه و کد تایید الزامیست', 400)


                const codeCache = phoneCache.get(phone)

                if (!codeCache)
                    this.error('کد تایید اشتباه است', 400)

                if (codeCache != code)
                    this.error('کد تایید اشتباه است', 400)

                phoneCache.del(phone)

                // update user on database
                // user.verified = true


                res.status(200).json({
                    success: true,
                    message: `شماره ${phone} تایید شد`
                })


            }
            catch (er) {
                const status = er.status || 500;
                res.status(status).json({
                    success: false,
                    message: er.message
                })
            }
        })


    }


    error(error, code) {
        let err = new Error(error);
        err.status = code
        throw err;
    }

    sendVrefyMsg(phone) {


        return new Promise((resolve, reject) => {
            const code = Math.randomCode(4)
            let content = `به سامانه تایید شماره تلفن تمرینی خوش آمدید !
            Code: ${code}`;
            api.Send({
                message: content,
                sender: "10004346",
                receptor: phone
            }, function (response, status) {
                if (status == 200) {
                    response.code = code
                    resolve(response)
                } else {
                    response = {
                        status: status,
                        message: response || `خطایی در ارسال پیام رخ داده است`
                    }
                    reject(response)
                }
            });

        })

    }


}

module.exports = application;