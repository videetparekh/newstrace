import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HeadlineCard from '../components/HeadlineCard'

const mockData = {
  city: 'Tokyo',
  country: 'Japan',
  headline: {
    title: 'Test headline title',
    source: 'TestSource',
    published_at: '2026-02-15T12:00:00Z',
    url: 'https://example.com/article',
    cached_at: '2026-02-15T12:00:00Z',
  },
}

describe('HeadlineCard', () => {
  it('renders nothing when data is null', () => {
    const { container } = render(<HeadlineCard data={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders headline data', () => {
    render(<HeadlineCard data={mockData} onClose={() => {}} />)
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Japan')).toBeInTheDocument()
    expect(screen.getByText('Test headline title')).toBeInTheDocument()
    expect(screen.getByText('TestSource')).toBeInTheDocument()
    expect(screen.getByText('Read full article')).toHaveAttribute('href', 'https://example.com/article')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<HeadlineCard data={mockData} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
