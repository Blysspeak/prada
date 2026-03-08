import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { EnumField } from './EnumField'

function TestEnumField(props: Omit<React.ComponentProps<typeof EnumField>, 'register'>) {
  const { register } = useForm()
  return <EnumField {...props} register={register} />
}

describe('EnumField', () => {
  const enumValues = ['ADMIN', 'USER', 'MODERATOR']

  it('renders select with options', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} />)
    const select = document.getElementById('role')!
    expect(select).toBeInTheDocument()
    expect(select.tagName).toBe('SELECT')
  })

  it('shows "Select {label}" default option', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} />)
    expect(screen.getByText('Select Role')).toBeInTheDocument()
  })

  it('shows all enum values as options', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} />)
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('USER')).toBeInTheDocument()
    expect(screen.getByText('MODERATOR')).toBeInTheDocument()
  })

  it('renders label', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} />)
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
  })

  it('shows required asterisk', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required asterisk when not required', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TestEnumField name="role" label="Role" values={enumValues} error="Role is required" />)
    expect(screen.getByText('Role is required')).toBeInTheDocument()
  })
})
