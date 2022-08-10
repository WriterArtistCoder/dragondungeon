import {
    getUserDetails,
    getUserDragon,
    getUserEntitlements,
    getUserStats,
    setUserDragon,
    setUserEntitlements,
    setUserStats,
} from './data'

import Stripe from 'stripe'

const stripeAccount = require('../config/private/stripesdk.json')
const stripe = new Stripe(stripeAccount.secretKey, {
    apiVersion: '2020-08-27',
})

export async function getLoadout(req, res) {
    try {
        let userClaims = await getUserDetails(req.query.user as string)
        let dragon = require(`../cache/${userClaims.uid}.json`)
        let userEntitlements = await getUserEntitlements(userClaims.uid)
        res.status(200)
        res.json({...dragon, skins: userEntitlements.skinEntitlements})
    } catch {
        res.status(200)
        res.json({
            ability: "Fireball",
            mod: 100,
            skin: 0
        })
    }
}

export async function equipItem(req, res) {
    try {
        let userClaims = await getUserDetails(req.query.user as string)

        if (req.query.type == 'ability') {
            let defaultMod = 100

            switch (req.params.id) {
                case "Iceball":
                    defaultMod = 200
                    break
                case "Electricball":
                    defaultMod = 300
                    break
                case "Mudball":
                    defaultMod = 400
                    break
                case "Poisonball":
                    defaultMod = 500
                    break
                default:
                    defaultMod = 100
                    break
            }

            await setUserDragon(
                {
                    ability: req.params.id,
                    mod: defaultMod
                },
                userClaims.uid
            )
            res.status(200)
            res.send('Success')
        } else if (req.query.type == 'mod') {
            await setUserDragon(
                {
                    mod: parseInt(req.params.id, 10),
                },
                userClaims.uid
            )
            res.status(200)
            res.send('Success')
        } else {
            let userEntitlements = await getUserEntitlements(userClaims.uid)
            if (
                userEntitlements.skinEntitlements.includes(parseInt(req.params.id, 10))
            ) {
                await setUserDragon(
                    {
                        skin: parseInt(req.params.id, 10),
                    },
                    userClaims.uid
                )
                res.status(200)
                res.send('Success')
            } else {
                res.status(402)
                res.send("playerHasGems" + userEntitlements.gems)
            }
        }
    } catch {
        res.status(400)
        res.send('Unknown error')
    }
}

export async function purchaseItem(req, res) {
    try {
        let userClaims = await getUserDetails(req.query.user as string)
        let playerEntitlements = await getUserEntitlements(userClaims.uid)

        let skinList = require('../public/api/skins.json')
        skinList.forEach(async (skin) => {
            if (skin.id == parseInt(req.params.id, 10)) {
                if (playerEntitlements.gems >= skin.gemCost) {
                    console.log('has enough gems')
                    playerEntitlements.skinEntitlements.push(skin.id)
                    await setUserEntitlements(
                        {
                            gems: playerEntitlements.gems - skin.gemCost,
                            skinEntitlements: playerEntitlements.skinEntitlements,
                        },
                        userClaims.uid,
                    )
                } else {
                    res.status(400)
                    res.send('Not enough gems')
                }
            }
        })

        res.status(200)
        res.send('Success')
    } catch {
        res.status(400)
        res.send('Unknown error')
    }
}

export async function purchaseInit(req, res) {
    let linePrice = 99

    switch (req.params.gemAmount) {
        case '500':
            linePrice = 499
            break
        case '1000':
            linePrice = 999
            break
        case '10000':
            linePrice = 9999
            break
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: linePrice,
        currency: 'usd',
        description: req.query.uid.toString(),
        automatic_payment_methods: { enabled: true },
    })

    res.send({ clientSecret: paymentIntent.client_secret })
}

export async function completePurchase(request, response) {
    try {
        let event: Stripe.Event = JSON.parse(request.body)
        console.log('stripe'.gray + ' - ' + event.type)
        if (event.type == 'charge.succeeded') {
            let gemCharge = event.data.object as Stripe.Charge
            let gemCredit = 100

            switch (gemCharge.amount) {
                case 499:
                    gemCredit = 550
                    break
                case 999:
                    gemCredit = 1100
                    break
                case 9999:
                    gemCredit = 11000
                    break
            }

            let authedCharge = await stripe.charges.retrieve(gemCharge.id)
            // Fraud protection - makes sure request isn't forged
            if (authedCharge.amount == gemCharge.amount) {
                let playerGems = await getUserEntitlements(gemCharge.description)
                if (playerGems.exists) {
                    await setUserEntitlements(
                        {
                            gems: (playerGems.data().gems || 0) + gemCredit,
                        },
                        gemCharge.description,
                    )
                } else {
                    await setUserEntitlements(
                        {
                            gems: gemCredit,
                        },
                        gemCharge.description,
                    )
                }
            }
        }
    } catch (err) {
        console.log(err.message)
        return response.status(400).send(err.message)
    }

    response.status(200)
}

export async function initUser(req, res) {
    try {
        let userClaims = await getUserDetails(req.query.user.toString())
        await setUserDragon(
            {
                ability: 'Fireball',
                skin: 0,
                mod: 100,
            },
            userClaims.uid,
        )
        await setUserEntitlements(
            {
                gems: 0,
                skinEntitlements: [0],
            },
            userClaims.uid,
        )
        await setUserStats(
            {
                fireballs: 0,
                coins: 0,
            },
            userClaims.uid,
        )
        res.status(200)
        res.send('Done')
    } catch {
        res.status(400)
        res.send("Couldn't initialize user")
    }
}

export async function linkAnet(req, res) {
    try {
        let userClaims = await getUserDetails(req.query.user.toString())
        let characterData = await (
            await fetch(
                `https://api.guildwars2.com/v2/characters/${req.query.char}?access_token=${req.query.token}`,
            )
        ).json()
        let userStoreDoc = await getUserEntitlements(userClaims.uid)
        let skinEntitlements = userStoreDoc.skinEntitlements

        switch (req.params.cid) {
            case 'Die 100 Times':
                if (characterData.deaths >= 10) {
                    skinEntitlements.push(5)
                    userStoreDoc.update({
                        skinEntitlements,
                    })
                    res.status(200)
                    res.send('Claimed')
                } else {
                    res.status(400)
                    res.send('Ineligible')
                }
                break
            case 'Reach Level 10':
                if (characterData.level >= 10) {
                    console.log('elig')
                    res.status(200)
                    res.send('Claimed')
                } else {
                    res.status(400)
                    res.send('Ineligible')
                }
                break
            case 'Reach Level 80':
                if (characterData.level >= 80) {
                    console.log('elig')
                    res.status(200)
                    res.send('Claimed')
                } else {
                    res.status(400)
                    res.send('Ineligible')
                }
                break
        }
    } catch {
        res.status(400)
        res.send('Error claiming reward')
    }
}