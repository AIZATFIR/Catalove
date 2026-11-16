# Catalove Pricing and WhatsApp Order Flow

## Goal

Make Catalove's pricing understandable and let visitors start a WhatsApp conversation without an empty or obstructing modal.

## Product direction

- Catalove offers a free entry plan supported by advertising.
- Business starts at Rp299rb.
- Enterprise starts at Rp799rb and can be customized to the brand's needs.
- Exact package scope, hosting, and domain details are confirmed in WhatsApp; the page must not imply that hosting or a domain is included.

## User experience

- The pricing section explains the free, Business, and Enterprise paths in plain language.
- Price labels for paid plans use “mulai” and make clear that the final scope is discussed with Catalove.
- Selecting a specific plan opens a WhatsApp chat to the configured `seller_whatsapp` number with a prefilled message naming that plan and its starting price.
- Generic “Pesan Catalove” actions open the same configured chat with a short request for package information.
- Remove the order configurator modal from these entry points so the page does not become blurred behind a modal that fails to appear.
- WhatsApp opens with a draft only; the visitor reviews and sends it themselves.

## Scope

This slice changes the Catalove marketing storefront's pricing copy and WhatsApp entry points. It does not implement ad placement, subscription billing, hosting provisioning, domain registration, or the catalog canvas editor. Those require separate product and technical decisions.

## Technical approach

Reuse the existing storefront settings hook and its `seller_whatsapp` value. Generate a `wa.me` URL with an encoded, plan-specific message. Replace modal event dispatch at shared Catalove CTAs and the pricing cards with links that work with mouse, keyboard, and mobile WhatsApp handling. Keep price and plan copy in the pricing component so the advertised starting values and messages stay consistent.

## Acceptance criteria

1. A visitor can see the free, Business, and Enterprise options and understand that the latter two have starting prices.
2. The pricing section explains that Enterprise can be customized and that final scope, hosting, and domain details are confirmed over WhatsApp.
3. Choosing Business or Enterprise opens a draft addressed to the configured seller number and naming the selected plan and starting price.
4. Generic Catalove order CTAs open a useful WhatsApp draft without an intermediate modal or blurred screen.
5. The WhatsApp draft is not sent automatically.

## Validation

Check the generated URLs for both plan actions and the generic action, confirm the configured seller number is used, and verify that pricing copy is visible and responsive on the storefront. Run the repository's relevant checks after implementation.
