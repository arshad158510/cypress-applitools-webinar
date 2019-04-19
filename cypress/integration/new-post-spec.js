/// <reference types="Cypress" />

import { title, about, article, tags } from '../fixtures/post'

describe('New post', () => {
  before(() => cy.registerUserIfNeeded())
  beforeEach(() => {
    cy.task('deleteAllArticles')
    cy.login()
  })

  it('adds a new post', () => {
    cy.contains('a.nav-link', 'New Post').click()

    // I have added "data-cy" attributes to select input fields
    cy.get('[data-cy=title]').type(title)
    cy.get('[data-cy=about]').type(about)

    // typing entire post as a human user takes too long
    // just set it at once!

    // instead of
    // cy.get('[data-cy=article]').type(article)

    // dispatch Redux actions
    cy.window()
      .its('store')
      .invoke('dispatch', {
        type: 'UPDATE_FIELD_EDITOR',
        key: 'body',
        value: article
      })

    // need to click "Enter" after each tag
    cy.get('[data-cy=tags]').type(tags.join('{enter}') + '{enter}')

    // and post the new article
    cy.get('[data-cy=publish]').click()

    // the url should show the new article
    cy.url().should('include', '/article/' + Cypress._.kebabCase(title))

    // new article should be on the server
    cy.request('http://localhost:3000/api/articles?limit=10&offset=0')
      .its('body')
      .should(body => {
        expect(body).to.have.property('articlesCount', 1)
        expect(body.articles).to.have.length(1)
        const firstPost = body.articles[0]
        expect(firstPost).to.contain({
          title,
          description: about,
          body: article
        })
        expect(firstPost)
          .property('tagList')
          .to.deep.equal(tags)
      })
  })
})
