import Cookies from 'js-cookie'
import licwDefaults from '../../configs/licwdefaults.json'
import { MorseViewModel } from '../morse'
import SavedSettingsInfo from '../settings/savedSettingsInfo'
import { GeneralUtils } from '../utils/general'
import { CookieInfo } from './CookieInfo'
import { ICookieHandler } from './ICookieHandler'

export class MorseCookies {
  static registeredHandlers:ICookieHandler[] = []
  static registerHandler = (handler:ICookieHandler) => {
    MorseCookies.registeredHandlers.push(handler)
  }

  static loadCookiesOrDefaults = (ctxt:MorseViewModel, ifLoadSettings:boolean, ignoreCookies:boolean = false, custom:SavedSettingsInfo[] = null) => {
    // load any existing cookie values

    const cks = Cookies.get()
    const cksKeys = []
    for (const key in cks) {
      cksKeys.push(key)
    }

    const settings = custom || licwDefaults.startupSettings
    const cookieFiltered = (ss) => {
      if (ignoreCookies) {
        return ss
      }
      // ignore setting for which there's a cookie
      return ss.filter((x) => cksKeys.indexOf(x.key) < 0)
    }

    const workAry = ifLoadSettings ? cookieFiltered(settings) : cksKeys
    const keyResolver = ifLoadSettings ? (x) => x.key : (x) => x
    const valResolver = ifLoadSettings ? (x) => x.value : (x) => cks[x]
    const specialHandling: CookieInfo[] = []
    const xtraspecialHandling: CookieInfo[] = []
    const otherHandling: CookieInfo[] = []
    if (workAry) {
      workAry.forEach((setting) => {
        const key = keyResolver(setting)
        let val = valResolver(setting)
        switch (key) {
          case 'syncWpm':
          case 'wpm':
          case 'fwpm':
          case 'syncFreq':
          case 'ditFrequency':
          case 'dahFrequency':
            xtraspecialHandling.push(<CookieInfo>{ key, val })
            break
          default:
            if (typeof ctxt[key] !== 'undefined') {
              if (key === 'xtraWordSpaceDits' && parseInt(val) === 0) {
                // prior functionality may have this at 0 so make it 1
                val = 1
              }
              ctxt[key](GeneralUtils.booleanize(val))
            } else {
              otherHandling.push(<CookieInfo>{ key, val })
            }
        }
      })
      MorseCookies.registeredHandlers.forEach((handler) => {
        handler.handleCookies(xtraspecialHandling)
        handler.handleCookies(otherHandling)
      })
      specialHandling.forEach((x) => {
        console.log('in special handling')
        ctxt[x.key](x.val)
      })
    }
  }
}
